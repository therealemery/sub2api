package service

import "context"

// UserModelRateEntry is a per-user, per-group model price override.
type UserModelRateEntry struct {
	ModelID        string  `json:"model_id"`
	RateMultiplier float64 `json:"rate_multiplier"`
}

type UserModelRateInput struct {
	ModelID        string  `json:"model_id"`
	RateMultiplier float64 `json:"rate_multiplier"`
}

// UserModelRateLookup is intentionally separate from UserGroupRateRepository
// so existing integrations and test doubles remain source-compatible.
type UserModelRateLookup interface {
	GetByUserAndGroupModel(ctx context.Context, userID, groupID int64, modelID string) (*float64, error)
	GetUserGroupModels(ctx context.Context, userID, groupID int64) ([]UserModelRateEntry, error)
	SyncUserGroupModels(ctx context.Context, userID, groupID int64, entries []UserModelRateInput) error
}
