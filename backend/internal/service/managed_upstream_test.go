package service

import (
	"context"
	"io"
	"net/http"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

type managedUpstreamUpdateRepo struct {
	AccountRepository
	account     *Account
	updateCalls int
}

func (r *managedUpstreamUpdateRepo) GetByID(context.Context, int64) (*Account, error) {
	return r.account, nil
}

func (r *managedUpstreamUpdateRepo) Update(_ context.Context, account *Account) error {
	r.updateCalls++
	r.account = account
	return nil
}

func TestValidateManagedUpstreamCredentials(t *testing.T) {
	valid := map[string]any{"base_url": "https://upstream.example", "api_key": "secret"}
	validPacky := map[string]any{
		"base_url":      "https://upstream.example",
		"api_key":       "secret",
		"model_mapping": map[string]any{"gpt-5.4": "gpt-5.4"},
	}
	validWan := map[string]any{"base_url": "https://ws-example.us-east-1.maas.aliyuncs.com/api/v1", "api_key": "secret", "model_mapping": map[string]any{"wan3.0-video": "wan3.0-video", "wan3.0-video-prime": "wan3.0-video-prime"}}
	tests := []struct {
		name        string
		platform    string
		typ         string
		credentials map[string]any
		extra       map[string]any
		wantErr     bool
	}{
		{name: "legacy account is unchanged", platform: PlatformOpenAI, typ: AccountTypeAPIKey},
		{name: "packy openai", platform: PlatformOpenAI, typ: AccountTypeUpstream, credentials: validPacky, extra: map[string]any{"upstream_provider": UpstreamProviderPackyAPI}},
		{name: "packy requires model whitelist", platform: PlatformOpenAI, typ: AccountTypeUpstream, credentials: valid, extra: map[string]any{"upstream_provider": UpstreamProviderPackyAPI}, wantErr: true},
		{name: "packy rejects insecure base url", platform: PlatformOpenAI, typ: AccountTypeUpstream, credentials: map[string]any{"base_url": "http://upstream.example", "api_key": "secret", "model_mapping": map[string]any{"gpt-5.4": "gpt-5.4"}}, extra: map[string]any{"upstream_provider": UpstreamProviderPackyAPI}, wantErr: true},
		{name: "packy rejects catch all wildcard", platform: PlatformOpenAI, typ: AccountTypeUpstream, credentials: map[string]any{"base_url": "https://upstream.example", "api_key": "secret", "model_mapping": map[string]any{"*": "*"}}, extra: map[string]any{"upstream_provider": UpstreamProviderPackyAPI}, wantErr: true},
		{name: "packy rejects prefix wildcard", platform: PlatformOpenAI, typ: AccountTypeUpstream, credentials: map[string]any{"base_url": "https://upstream.example", "api_key": "secret", "model_mapping": map[string]any{"gpt-*": "gpt-*"}}, extra: map[string]any{"upstream_provider": UpstreamProviderPackyAPI}, wantErr: true},
		{name: "dc api video", platform: PlatformOpenAI, typ: AccountTypeUpstream, credentials: map[string]any{"base_url": "https://console.dc-api.com", "api_key": "secret", "model": "MiniMax-H3"}, extra: map[string]any{"upstream_provider": UpstreamProviderDCAPI}},
		{name: "dc api key account", platform: PlatformOpenAI, typ: AccountTypeAPIKey, credentials: map[string]any{"base_url": "https://console.dc-api.com", "api_key": "secret", "model": "MiniMax-H3"}, extra: map[string]any{"upstream_provider": UpstreamProviderDCAPI}},
		{name: "alibaba video", platform: PlatformOpenAI, typ: AccountTypeAPIKey, credentials: validWan, extra: map[string]any{"upstream_provider": UpstreamProviderAlibabaVideo}},
		{name: "alibaba rejects compatible root", platform: PlatformOpenAI, typ: AccountTypeAPIKey, credentials: map[string]any{"base_url": "https://ws-example.us-east-1.maas.aliyuncs.com/compatible-mode/v1", "api_key": "secret", "model_mapping": map[string]any{"wan3.0-video": "wan3.0-video"}}, extra: map[string]any{"upstream_provider": UpstreamProviderAlibabaVideo}, wantErr: true},
		{name: "alibaba rejects unknown model", platform: PlatformOpenAI, typ: AccountTypeAPIKey, credentials: map[string]any{"base_url": "https://ws-example.us-east-1.maas.aliyuncs.com/api/v1", "api_key": "secret", "model_mapping": map[string]any{"MiniMax-H3": "MiniMax-H3"}}, extra: map[string]any{"upstream_provider": UpstreamProviderAlibabaVideo}, wantErr: true},
		{name: "dc api rejects video resource path", platform: PlatformOpenAI, typ: AccountTypeAPIKey, credentials: map[string]any{"base_url": "https://console.dc-api.com/v1/videos", "api_key": "secret", "model": "MiniMax-H3"}, extra: map[string]any{"upstream_provider": UpstreamProviderDCAPI}, wantErr: true},
		{name: "dc api rejects another service root", platform: PlatformOpenAI, typ: AccountTypeAPIKey, credentials: map[string]any{"base_url": "https://dc.example", "api_key": "secret", "model": "MiniMax-H3"}, extra: map[string]any{"upstream_provider": UpstreamProviderDCAPI}, wantErr: true},
		{name: "dc api rejects wrong model", platform: PlatformOpenAI, typ: AccountTypeAPIKey, credentials: map[string]any{"base_url": "https://console.dc-api.com", "api_key": "secret", "model": "MiniMax-H2"}, extra: map[string]any{"upstream_provider": UpstreamProviderDCAPI}, wantErr: true},
		{name: "dc api rejects wrong platform", platform: PlatformAnthropic, typ: AccountTypeAPIKey, credentials: map[string]any{"base_url": "https://console.dc-api.com", "api_key": "secret", "model": "MiniMax-H3"}, extra: map[string]any{"upstream_provider": UpstreamProviderDCAPI}, wantErr: true},
		{name: "packy wrong platform", platform: PlatformAnthropic, typ: AccountTypeUpstream, credentials: validPacky, extra: map[string]any{"upstream_provider": UpstreamProviderPackyAPI}, wantErr: true},
		{name: "dc api missing model", platform: PlatformOpenAI, typ: AccountTypeUpstream, credentials: valid, extra: map[string]any{"upstream_provider": UpstreamProviderDCAPI}, wantErr: true},
		{name: "unknown provider", platform: PlatformOpenAI, typ: AccountTypeUpstream, credentials: valid, extra: map[string]any{"upstream_provider": "other"}, wantErr: true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if err := ValidateManagedUpstreamCredentials(tt.platform, tt.typ, tt.credentials, tt.extra); (err != nil) != tt.wantErr {
				t.Fatalf("ValidateManagedUpstreamCredentials() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestAdminUpdateAccountValidatesManagedCredentialsWhenExtraIsOmitted(t *testing.T) {
	repo := &managedUpstreamUpdateRepo{account: &Account{
		ID:       73,
		Platform: PlatformOpenAI,
		Type:     AccountTypeAPIKey,
		Credentials: map[string]any{
			"base_url":      "https://ws-example.us-east-1.maas.aliyuncs.com/api/v1",
			"api_key":       "private-secret",
			"model_mapping": map[string]any{"wan3.0-video": "wan3.0-video"},
		},
		Extra: map[string]any{"upstream_provider": UpstreamProviderAlibabaVideo},
	}}
	svc := &adminServiceImpl{accountRepo: repo}

	_, err := svc.UpdateAccount(context.Background(), 73, &UpdateAccountInput{
		Credentials: map[string]any{
			"base_url":      "https://ws-example.us-east-1.maas.aliyuncs.com/compatible-mode/v1",
			"api_key":       "private-secret",
			"model_mapping": map[string]any{"wan3.0-video": "wan3.0-video"},
		},
	})

	require.ErrorContains(t, err, "Workspace /api/v1")
	require.Zero(t, repo.updateCalls)
}

func TestAlibabaVideoRoutingAndForwarding(t *testing.T) {
	account := Account{
		ID: 9, Platform: PlatformOpenAI, Type: AccountTypeAPIKey, Status: StatusActive, Schedulable: true, Concurrency: 2,
		Credentials: map[string]any{
			"base_url":      "https://ws-example.us-east-1.maas.aliyuncs.com/api/v1",
			"api_key":       "private-secret",
			"model_mapping": map[string]any{"wan3.0-video": "wan3.0-video"},
		},
		Extra: map[string]any{"upstream_provider": UpstreamProviderAlibabaVideo},
	}
	upstream := &httpUpstreamRecorder{resp: &http.Response{StatusCode: http.StatusOK, Header: make(http.Header), Body: io.NopCloser(strings.NewReader(`{}`))}}
	svc := &GatewayService{accountRepo: stubOpenAIAccountRepo{accounts: []Account{account}}, httpUpstream: upstream}

	selected, err := svc.SelectAlibabaVideoAccount(context.Background(), "wan3.0-video")
	require.NoError(t, err)
	require.Equal(t, int64(9), selected.ID)
	_, err = svc.SelectAlibabaVideoAccount(context.Background(), "wan3.0-video-prime")
	require.Error(t, err)

	resp, err := svc.ForwardAlibabaVideo(context.Background(), selected, http.MethodPost, "/services/aigc/video-generation/video-synthesis", []byte(`{"model":"wan3.0-video"}`))
	require.NoError(t, err)
	require.Equal(t, http.StatusOK, resp.StatusCode)
	require.Equal(t, "https://ws-example.us-east-1.maas.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis", upstream.lastReq.URL.String())
	require.Equal(t, "Bearer private-secret", upstream.lastReq.Header.Get("Authorization"))
	require.Equal(t, "enable", upstream.lastReq.Header.Get("X-DashScope-Async"))
	require.Equal(t, "application/json", upstream.lastReq.Header.Get("Content-Type"))
}

func TestFetchAlibabaVideoContentUsesPrivateServerSideRequest(t *testing.T) {
	account := &Account{
		ID: 10, Platform: PlatformOpenAI, Type: AccountTypeAPIKey,
		Extra: map[string]any{"upstream_provider": UpstreamProviderAlibabaVideo},
	}
	upstream := &httpUpstreamRecorder{resp: &http.Response{
		StatusCode: http.StatusOK,
		Header:     http.Header{"Content-Type": []string{"video/mp4"}},
		Body:       io.NopCloser(strings.NewReader("video-bytes")),
	}}
	svc := &GatewayService{httpUpstream: upstream}

	resp, err := svc.FetchAlibabaVideoContent(context.Background(), account, "https://aliyuncs.com/results/video.mp4?Expires=1&Signature=test")
	require.NoError(t, err)
	defer resp.Body.Close()
	require.Equal(t, http.MethodGet, upstream.lastReq.Method)
	require.Equal(t, "https://aliyuncs.com/results/video.mp4?Expires=1&Signature=test", upstream.lastReq.URL.String())
	require.True(t, HasAlibabaVideoContentRedirectPolicy(upstream.lastReq.Context()))
	require.Empty(t, upstream.lastReq.Header.Get("Authorization"))
}

func TestValidateAlibabaVideoContentURL(t *testing.T) {
	parsed, err := ValidateAlibabaVideoContentURL("https://aliyuncs.com/path/video.mp4?Expires=1&Signature=test")
	require.NoError(t, err)
	require.Equal(t, "aliyuncs.com", parsed.Hostname())
	for _, invalid := range []string{
		"https://aliyuncs.com/path/video.mp4",
		"http://dashscope-result-bj.oss-cn-beijing.aliyuncs.com/video.mp4",
		"https://aliyuncs.com.evil.example/video.mp4",
		"https://127.0.0.1/video.mp4",
		"https://user:pass@aliyuncs.com/video.mp4",
	} {
		_, err := ValidateAlibabaVideoContentURL(invalid)
		require.Error(t, err, invalid)
	}
}
