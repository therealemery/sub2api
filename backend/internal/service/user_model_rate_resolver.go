package service

import (
	"context"
	"strings"

	"github.com/Wei-Shaw/sub2api/internal/pkg/logger"
)

type userModelRateResolver struct {
	repo         UserModelRateLookup
	logComponent string
}

func newUserModelRateResolver(repo UserModelRateLookup, logComponent string) *userModelRateResolver {
	return &userModelRateResolver{repo: repo, logComponent: logComponent}
}

func (r *userModelRateResolver) Resolve(ctx context.Context, userID, groupID int64, modelID string, fallback float64) float64 {
	if r == nil || r.repo == nil || userID <= 0 || groupID <= 0 || strings.TrimSpace(modelID) == "" {
		return fallback
	}
	rate, err := r.repo.GetByUserAndGroupModel(ctx, userID, groupID, strings.TrimSpace(modelID))
	if err != nil {
		logger.LegacyPrintf(r.logComponent, "get user model rate failed, fallback: user=%d group=%d model=%s err=%v", userID, groupID, modelID, err)
		return fallback
	}
	if rate != nil {
		return *rate
	}
	return fallback
}
