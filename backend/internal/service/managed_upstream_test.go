package service

import "testing"

func TestValidateManagedUpstreamCredentials(t *testing.T) {
	valid := map[string]any{"base_url": "https://upstream.example", "api_key": "secret"}
	tests := []struct {
		name        string
		platform    string
		typ         string
		credentials map[string]any
		extra       map[string]any
		wantErr     bool
	}{
		{name: "legacy account is unchanged", platform: PlatformOpenAI, typ: AccountTypeAPIKey},
		{name: "packy openai", platform: PlatformOpenAI, typ: AccountTypeUpstream, credentials: valid, extra: map[string]any{"upstream_provider": UpstreamProviderPackyAPI}},
		{name: "dc api video", platform: PlatformOpenAI, typ: AccountTypeUpstream, credentials: map[string]any{"base_url": "https://dc.example", "api_key": "secret", "model": "MiniMax-H3"}, extra: map[string]any{"upstream_provider": UpstreamProviderDCAPI}},
		{name: "packy wrong platform", platform: PlatformAnthropic, typ: AccountTypeUpstream, credentials: valid, extra: map[string]any{"upstream_provider": UpstreamProviderPackyAPI}, wantErr: true},
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
