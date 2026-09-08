//go:build unit

package service

import (
	"context"
	"database/sql"
	"testing"

	dbent "github.com/Wei-Shaw/sub2api/ent"
	"github.com/Wei-Shaw/sub2api/ent/enttest"
	"github.com/stretchr/testify/require"

	"entgo.io/ent/dialect"
	entsql "entgo.io/ent/dialect/sql"
	_ "modernc.org/sqlite"
)

func newUsageVideoTaskTestClient(t *testing.T) *dbent.Client {
	t.Helper()
	db, err := sql.Open("sqlite", "file:usage_video_task?mode=memory&cache=shared&_pragma=foreign_keys(1)")
	require.NoError(t, err)
	t.Cleanup(func() { _ = db.Close() })
	drv := entsql.OpenDB(dialect.SQLite, db)
	client := enttest.NewClient(t, enttest.WithOptions(dbent.Driver(drv)))
	t.Cleanup(func() { _ = client.Close() })
	_, err = client.ExecContext(context.Background(), `
		CREATE TABLE usage_video_tasks (
			usage_log_id INTEGER PRIMARY KEY,
			user_id INTEGER NOT NULL,
			task_id TEXT NOT NULL,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
		)
	`)
	require.NoError(t, err)
	return client
}

func TestUsageServiceGetVideoTaskIDScopesByOwner(t *testing.T) {
	ctx := context.Background()
	client := newUsageVideoTaskTestClient(t)
	_, err := client.ExecContext(ctx, `INSERT INTO usage_video_tasks (usage_log_id, user_id, task_id) VALUES (?, ?, ?)`, 41, 7, "video_opaque")
	require.NoError(t, err)

	svc := NewUsageService(nil, nil, client, nil)
	taskID, err := svc.GetVideoTaskID(ctx, 41, 7)
	require.NoError(t, err)
	require.Equal(t, "video_opaque", taskID)

	_, err = svc.GetVideoTaskID(ctx, 41, 8)
	require.ErrorIs(t, err, ErrUsageLogNotFound)
}
