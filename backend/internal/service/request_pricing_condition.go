package service

import (
	"errors"
	"fmt"
	"math"
	"sort"
	"strings"
	"sync"
	"time"
)

const deepSeekWeekdayPeakRuleID = "deepseek-weekday-peak-2026-09-13"

// RequestPricingTimeWindow is a half-open local-time interval expressed as
// minutes after midnight: [StartMinute, EndMinute).
type RequestPricingTimeWindow struct {
	StartMinute int `json:"start_minute"`
	EndMinute   int `json:"end_minute"`
}

// RequestPricingConditionRule is the private, backend-owned rule definition.
// Source and UpstreamCostMultiplier must never be included in public payloads.
type RequestPricingConditionRule struct {
	ID                     string
	Models                 []string
	Timezone               string
	Weekdays               []time.Weekday
	Windows                []RequestPricingTimeWindow
	CustomerMultiplier     float64
	UpstreamCostMultiplier float64
	NameEN                 string
	NameZH                 string
	Source                 string
	VerifiedAt             string
}

// PublicRequestPricingConditionRule is the sanitized rule representation used
// by the public model display. It intentionally omits upstream accounting data.
type PublicRequestPricingConditionRule struct {
	ID                 string                     `json:"id"`
	Models             []string                   `json:"models"`
	Timezone           string                     `json:"timezone"`
	Weekdays           []time.Weekday             `json:"weekdays"`
	Windows            []RequestPricingTimeWindow `json:"windows"`
	CustomerMultiplier float64                    `json:"customer_multiplier"`
	NameEN             string                     `json:"name_en"`
	NameZH             string                     `json:"name_zh"`
}

// RequestPricingContext is locked immediately before an upstream attempt. The
// accounting model is filled after private model mapping by the caller.
type RequestPricingContext struct {
	CanonicalModel         string
	AccountingModel        string
	EffectiveAt            time.Time
	RuleID                 string
	CustomerMultiplier     float64
	UpstreamCostMultiplier float64
}

type PricingClock func() time.Time

var requestPricingConditionRules = []RequestPricingConditionRule{
	{
		ID:       deepSeekWeekdayPeakRuleID,
		Models:   []string{"deepseek-v4.1-flash"},
		Timezone: "Asia/Shanghai",
		Weekdays: []time.Weekday{
			time.Monday,
			time.Tuesday,
			time.Wednesday,
			time.Thursday,
			time.Friday,
		},
		Windows: []RequestPricingTimeWindow{
			{StartMinute: 9 * 60, EndMinute: 12 * 60},
			{StartMinute: 14 * 60, EndMinute: 18 * 60},
		},
		CustomerMultiplier:     2,
		UpstreamCostMultiplier: 2,
		NameEN:                 "Weekday peak pricing",
		NameZH:                 "工作日高峰计费",
		Source:                 "signed-in upstream pricing notice",
		VerifiedAt:             "2026-09-13",
	},
}

type compiledRequestPricingConditionRule struct {
	rule     RequestPricingConditionRule
	location *time.Location
	weekdays map[time.Weekday]struct{}
}

var requestPricingConditionRegistry struct {
	once    sync.Once
	byModel map[string]compiledRequestPricingConditionRule
	err     error
}

// ValidateRequestPricingConditionRules rejects ambiguous or unusable rule
// sets. Runtime resolution is fail-closed if this validation ever fails.
func ValidateRequestPricingConditionRules(rules []RequestPricingConditionRule) error {
	seenIDs := make(map[string]struct{}, len(rules))
	modelOwners := make(map[string]string)

	for i := range rules {
		rule := rules[i]
		id := strings.TrimSpace(rule.ID)
		if id == "" {
			return fmt.Errorf("request pricing rule %d has an empty id", i)
		}
		if _, exists := seenIDs[id]; exists {
			return fmt.Errorf("duplicate request pricing rule id %q", id)
		}
		seenIDs[id] = struct{}{}

		if len(rule.Models) == 0 {
			return fmt.Errorf("request pricing rule %q has no models", id)
		}
		for _, rawModel := range rule.Models {
			model := canonicalRequestPricingModel(rawModel)
			if model == "" {
				return fmt.Errorf("request pricing rule %q has an empty model", id)
			}
			if owner, exists := modelOwners[model]; exists {
				return fmt.Errorf("request pricing model %q is owned by both %q and %q", model, owner, id)
			}
			modelOwners[model] = id
		}

		if _, err := time.LoadLocation(strings.TrimSpace(rule.Timezone)); err != nil {
			return fmt.Errorf("request pricing rule %q has invalid timezone: %w", id, err)
		}
		if len(rule.Weekdays) == 0 {
			return fmt.Errorf("request pricing rule %q has no weekdays", id)
		}
		seenWeekdays := make(map[time.Weekday]struct{}, len(rule.Weekdays))
		for _, weekday := range rule.Weekdays {
			if weekday < time.Sunday || weekday > time.Saturday {
				return fmt.Errorf("request pricing rule %q has invalid weekday %d", id, weekday)
			}
			if _, exists := seenWeekdays[weekday]; exists {
				return fmt.Errorf("request pricing rule %q has duplicate weekday %d", id, weekday)
			}
			seenWeekdays[weekday] = struct{}{}
		}

		if len(rule.Windows) == 0 {
			return fmt.Errorf("request pricing rule %q has no time windows", id)
		}
		windows := append([]RequestPricingTimeWindow(nil), rule.Windows...)
		sort.Slice(windows, func(i, j int) bool {
			return windows[i].StartMinute < windows[j].StartMinute
		})
		for windowIndex, window := range windows {
			if window.StartMinute < 0 || window.EndMinute > 24*60 || window.StartMinute >= window.EndMinute {
				return fmt.Errorf("request pricing rule %q has invalid window [%d,%d)", id, window.StartMinute, window.EndMinute)
			}
			if windowIndex > 0 && windows[windowIndex-1].EndMinute > window.StartMinute {
				return fmt.Errorf("request pricing rule %q has overlapping windows", id)
			}
		}

		if !isFinitePositivePricingMultiplier(rule.CustomerMultiplier) {
			return fmt.Errorf("request pricing rule %q has invalid customer multiplier", id)
		}
		if !isFinitePositivePricingMultiplier(rule.UpstreamCostMultiplier) {
			return fmt.Errorf("request pricing rule %q has invalid upstream cost multiplier", id)
		}
	}

	return nil
}

func isFinitePositivePricingMultiplier(value float64) bool {
	return value > 0 && !math.IsNaN(value) && !math.IsInf(value, 0)
}

func canonicalRequestPricingModel(model string) string {
	normalized := strings.ToLower(strings.TrimSpace(model))
	normalized = strings.ReplaceAll(normalized, "_", "-")
	return normalized
}

func loadRequestPricingConditionRegistry() (map[string]compiledRequestPricingConditionRule, error) {
	requestPricingConditionRegistry.once.Do(func() {
		if err := ValidateRequestPricingConditionRules(requestPricingConditionRules); err != nil {
			requestPricingConditionRegistry.err = err
			return
		}

		requestPricingConditionRegistry.byModel = make(map[string]compiledRequestPricingConditionRule)
		for _, rule := range requestPricingConditionRules {
			location, err := time.LoadLocation(strings.TrimSpace(rule.Timezone))
			if err != nil {
				requestPricingConditionRegistry.err = err
				return
			}
			compiled := compiledRequestPricingConditionRule{
				rule:     cloneRequestPricingConditionRule(rule),
				location: location,
				weekdays: make(map[time.Weekday]struct{}, len(rule.Weekdays)),
			}
			for _, weekday := range rule.Weekdays {
				compiled.weekdays[weekday] = struct{}{}
			}
			for _, model := range rule.Models {
				requestPricingConditionRegistry.byModel[canonicalRequestPricingModel(model)] = compiled
			}
		}
	})

	return requestPricingConditionRegistry.byModel, requestPricingConditionRegistry.err
}

// ResolveRequestPricingContext evaluates the backend-owned rule set at sentAt.
func ResolveRequestPricingContext(model string, sentAt time.Time) (RequestPricingContext, error) {
	canonicalModel := canonicalRequestPricingModel(model)
	if canonicalModel == "" {
		return RequestPricingContext{}, errors.New("request pricing model is required")
	}
	if sentAt.IsZero() {
		return RequestPricingContext{}, errors.New("request pricing effective time is required")
	}

	context := RequestPricingContext{
		CanonicalModel:         canonicalModel,
		EffectiveAt:            sentAt.UTC(),
		CustomerMultiplier:     1,
		UpstreamCostMultiplier: 1,
	}
	registry, err := loadRequestPricingConditionRegistry()
	if err != nil {
		return RequestPricingContext{}, fmt.Errorf("invalid request pricing condition registry: %w", err)
	}
	compiled, applies := registry[canonicalModel]
	if !applies {
		return context, nil
	}

	localTime := sentAt.In(compiled.location)
	if _, appliesToday := compiled.weekdays[localTime.Weekday()]; !appliesToday {
		return context, nil
	}
	minuteOfDay := localTime.Hour()*60 + localTime.Minute()
	for _, window := range compiled.rule.Windows {
		if minuteOfDay >= window.StartMinute && minuteOfDay < window.EndMinute {
			context.RuleID = compiled.rule.ID
			context.CustomerMultiplier = compiled.rule.CustomerMultiplier
			context.UpstreamCostMultiplier = compiled.rule.UpstreamCostMultiplier
			break
		}
	}

	return context, nil
}

// PublicRequestPricingConditionRules returns defensive, sanitized copies.
func PublicRequestPricingConditionRules() []PublicRequestPricingConditionRule {
	if _, err := loadRequestPricingConditionRegistry(); err != nil {
		return nil
	}
	rules := make([]PublicRequestPricingConditionRule, 0, len(requestPricingConditionRules))
	for _, rule := range requestPricingConditionRules {
		models := make([]string, 0, len(rule.Models))
		for _, model := range rule.Models {
			models = append(models, canonicalRequestPricingModel(model))
		}
		rules = append(rules, PublicRequestPricingConditionRule{
			ID:                 rule.ID,
			Models:             models,
			Timezone:           rule.Timezone,
			Weekdays:           append([]time.Weekday(nil), rule.Weekdays...),
			Windows:            append([]RequestPricingTimeWindow(nil), rule.Windows...),
			CustomerMultiplier: rule.CustomerMultiplier,
			NameEN:             rule.NameEN,
			NameZH:             rule.NameZH,
		})
	}
	return rules
}

func cloneRequestPricingConditionRule(rule RequestPricingConditionRule) RequestPricingConditionRule {
	cloned := rule
	cloned.Models = append([]string(nil), rule.Models...)
	cloned.Weekdays = append([]time.Weekday(nil), rule.Weekdays...)
	cloned.Windows = append([]RequestPricingTimeWindow(nil), rule.Windows...)
	return cloned
}
