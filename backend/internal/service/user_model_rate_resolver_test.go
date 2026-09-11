package service

import (
	"context"
	"errors"
	"testing"

	"github.com/stretchr/testify/require"
)

type modelRateRepoStub struct {
	rate *float64
	err  error
}

func (s modelRateRepoStub) GetByUserAndGroupModel(context.Context, int64, int64, string) (*float64, error) {
	return s.rate, s.err
}
func (s modelRateRepoStub) GetUserGroupModels(context.Context, int64, int64) ([]UserModelRateEntry, error) {
	return nil, nil
}
func (s modelRateRepoStub) SyncUserGroupModels(context.Context, int64, int64, []UserModelRateInput) error {
	return nil
}

func TestUserModelRateResolverUsesOverrideAndFallback(t *testing.T) {
	value := 0.8
	resolver := newUserModelRateResolver(modelRateRepoStub{rate: &value}, "test")
	require.InDelta(t, 0.8, resolver.Resolve(context.Background(), 1, 2, "gpt-5.4", 1), 1e-9)
}

func TestUserModelRateResolverFallsBackWhenMissingOrErrored(t *testing.T) {
	for _, repo := range []modelRateRepoStub{{}, {err: errors.New("db down")}} {
		resolver := newUserModelRateResolver(repo, "test")
		require.InDelta(t, 0.7, resolver.Resolve(context.Background(), 1, 2, "gpt-5.4", 0.7), 1e-9)
	}
}
