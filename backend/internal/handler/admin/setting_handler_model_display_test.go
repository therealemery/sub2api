//go:build unit

package admin

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/Wei-Shaw/sub2api/internal/config"
	"github.com/Wei-Shaw/sub2api/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
)

type modelDisplaySettingRepoStub struct {
	values map[string]string
}

func (s *modelDisplaySettingRepoStub) Get(ctx context.Context, key string) (*service.Setting, error) {
	if value, ok := s.values[key]; ok {
		return &service.Setting{Key: key, Value: value}, nil
	}
	return nil, service.ErrSettingNotFound
}

func (s *modelDisplaySettingRepoStub) GetValue(ctx context.Context, key string) (string, error) {
	if value, ok := s.values[key]; ok {
		return value, nil
	}
	return "", nil
}

func (s *modelDisplaySettingRepoStub) Set(ctx context.Context, key, value string) error {
	s.values[key] = value
	return nil
}

func (s *modelDisplaySettingRepoStub) GetMultiple(ctx context.Context, keys []string) (map[string]string, error) {
	out := make(map[string]string, len(keys))
	for _, key := range keys {
		if value, ok := s.values[key]; ok {
			out[key] = value
		}
	}
	return out, nil
}

func (s *modelDisplaySettingRepoStub) SetMultiple(ctx context.Context, settings map[string]string) error {
	for key, value := range settings {
		s.values[key] = value
	}
	return nil
}

func (s *modelDisplaySettingRepoStub) GetAll(ctx context.Context) (map[string]string, error) {
	out := make(map[string]string, len(s.values))
	for key, value := range s.values {
		out[key] = value
	}
	return out, nil
}

func (s *modelDisplaySettingRepoStub) Delete(ctx context.Context, key string) error {
	delete(s.values, key)
	return nil
}

func TestAdminSettingHandler_GetModelDisplayConfig(t *testing.T) {
	gin.SetMode(gin.TestMode)

	h := NewSettingHandler(service.NewSettingService(&modelDisplaySettingRepoStub{
		values: map[string]string{
			service.SettingKeyModelDisplayConfig: `{"featured_models":[{"model":"gpt-5.4","platform":"openai","sort_order":1}],"pricing_models":[]}`,
		},
	}, &config.Config{}), nil, nil, nil, nil, nil)

	recorder := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(recorder)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/v1/admin/settings/model-display", nil)

	h.GetModelDisplayConfig(c)

	require.Equal(t, http.StatusOK, recorder.Code)
	var resp struct {
		Code int `json:"code"`
		Data struct {
			FeaturedModels []service.FeaturedModelConfig `json:"featured_models"`
		} `json:"data"`
	}
	require.NoError(t, json.Unmarshal(recorder.Body.Bytes(), &resp))
	require.Equal(t, 0, resp.Code)
	require.Equal(t, []service.FeaturedModelConfig{{Model: "gpt-5.4", Platform: "openai", SortOrder: 1}}, resp.Data.FeaturedModels)
}

func TestAdminSettingHandler_UpdateModelDisplayConfig(t *testing.T) {
	gin.SetMode(gin.TestMode)

	repo := &modelDisplaySettingRepoStub{values: map[string]string{}}
	h := NewSettingHandler(service.NewSettingService(repo, &config.Config{}), nil, nil, nil, nil, nil)

	body := `{
		"featured_models":[{"model":" claude-sonnet-4.5 ","platform":"Anthropic","badge":"主推","sort_order":1}],
		"pricing_models":[{"model":" claude-sonnet-4.5 ","platform":"Anthropic","billing_mode":"bad","input_price":0.0000018,"output_price":0.000009,"sort_order":1}],
		"reference_discount":0.6
	}`
	recorder := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(recorder)
	c.Request = httptest.NewRequest(http.MethodPut, "/api/v1/admin/settings/model-display", strings.NewReader(body))
	c.Request.Header.Set("Content-Type", "application/json")

	h.UpdateModelDisplayConfig(c)

	require.Equal(t, http.StatusOK, recorder.Code)
	require.NotEmpty(t, repo.values[service.SettingKeyModelDisplayConfig])

	var resp struct {
		Code int                        `json:"code"`
		Data service.ModelDisplayConfig `json:"data"`
	}
	require.NoError(t, json.Unmarshal(recorder.Body.Bytes(), &resp))
	require.Equal(t, 0, resp.Code)
	require.Equal(t, "claude-sonnet-4.5", resp.Data.PricingModels[0].Model)
	require.Equal(t, "anthropic", resp.Data.PricingModels[0].Platform)
	require.Equal(t, string(service.BillingModeToken), resp.Data.PricingModels[0].BillingMode)
	require.Equal(t, 0.6, *resp.Data.ReferenceDiscount)
}

func TestAdminSettingHandler_UpdateModelDisplayConfig_InvalidJSON(t *testing.T) {
	gin.SetMode(gin.TestMode)

	h := NewSettingHandler(service.NewSettingService(&modelDisplaySettingRepoStub{values: map[string]string{}}, &config.Config{}), nil, nil, nil, nil, nil)

	recorder := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(recorder)
	c.Request = httptest.NewRequest(http.MethodPut, "/api/v1/admin/settings/model-display", strings.NewReader("{bad-json"))
	c.Request.Header.Set("Content-Type", "application/json")

	h.UpdateModelDisplayConfig(c)

	require.Equal(t, http.StatusBadRequest, recorder.Code)
}
