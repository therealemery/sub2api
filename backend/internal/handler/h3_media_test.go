package handler

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

var tinyPNG = []byte{0x89, 'P', 'N', 'G', 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 'I', 'E', 'N', 'D'}

func TestBuildH3UpstreamRequestKeepsTextOnlyJSON(t *testing.T) {
	body, contentType, err := buildH3UpstreamRequest(map[string]any{
		"prompt": "A paper boat", "model": miniMaxH3Model,
	}, 5, "2k")
	require.NoError(t, err)
	require.Equal(t, "application/json", contentType)
	var got map[string]any
	require.NoError(t, json.Unmarshal(body, &got))
	require.Equal(t, "2544x1456", got["size"])
}

func TestBuildH3UpstreamRequestEncodesReferenceMediaAsMultipart(t *testing.T) {
	pngURI := "data:image/png;base64," + base64.StdEncoding.EncodeToString(tinyPNG)
	mp4 := append([]byte{0, 0, 0, 12}, []byte("ftypisom")...)
	mp4URI := "data:video/mp4;base64," + base64.StdEncoding.EncodeToString(mp4)
	mp3URI := "data:audio/mpeg;base64," + base64.StdEncoding.EncodeToString([]byte("ID3audio"))
	body, contentType, err := buildH3UpstreamRequest(map[string]any{
		"prompt":           "Follow the references",
		"reference_images": []any{pngURI},
		"reference_videos": []any{mp4URI},
		"reference_audios": []any{mp3URI},
	}, 5, "2k")
	require.NoError(t, err)
	require.Contains(t, contentType, "multipart/form-data")
	reader := multipart.NewReader(bytes.NewReader(body), strings.TrimPrefix(contentType, "multipart/form-data; boundary="))
	seen := map[string]int{}
	for {
		part, nextErr := reader.NextPart()
		if nextErr == io.EOF {
			break
		}
		require.NoError(t, nextErr)
		seen[part.FormName()]++
		data, readErr := io.ReadAll(part)
		require.NoError(t, readErr)
		if part.FormName() == "input_reference" && part.FileName() != "" {
			require.Equal(t, "image/png", part.Header.Get("Content-Type"))
			require.Equal(t, tinyPNG, data)
		}
	}
	require.Equal(t, 1, seen["input_reference"])
	require.Equal(t, 1, seen["reference_videos"])
	require.Equal(t, 1, seen["reference_audios"])
}

func TestParseVideoCreateRequestAcceptsMultipartUpload(t *testing.T) {
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	require.NoError(t, writer.WriteField("model", miniMaxH3Model))
	require.NoError(t, writer.WriteField("prompt", "Animate the image"))
	require.NoError(t, writer.WriteField("seconds", "5"))
	part, err := writer.CreateFormFile("input_reference", "reference.png")
	require.NoError(t, err)
	_, err = part.Write(tinyPNG)
	require.NoError(t, err)
	require.NoError(t, writer.Close())

	req := httptest.NewRequest("POST", "/v1/videos", &body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	request, err := parseVideoCreateRequest(req)
	require.NoError(t, err)
	defer cleanupVideoCreateRequest(request)
	require.Equal(t, float64(5), request["seconds"])
	values := h3MediaValues(request["input_reference"])
	require.Len(t, values, 1)
	require.NotNil(t, values[0].Upload)
	require.Equal(t, "image/png", values[0].Upload.MIME)
	require.Equal(t, "reference.png", values[0].Upload.Name)
}

func TestValidateH3MediaRules(t *testing.T) {
	pngURI := "data:image/png;base64," + base64.StdEncoding.EncodeToString(tinyPNG)
	tests := []struct {
		name    string
		request map[string]any
		message string
	}{
		{"audio needs image", map[string]any{"reference_audios": []any{"https://example.com/audio.mp3"}}, "requires at least one"},
		{"frames exclusive", map[string]any{"first_frame": pngURI, "reference_images": []any{pngURI}}, "cannot be combined"},
		{"http rejected", map[string]any{"reference_images": []any{"http://example.com/a.png"}}, "HTTPS"},
		{"bad image bytes", map[string]any{"reference_images": []any{"data:image/png;base64," + base64.StdEncoding.EncodeToString([]byte("not png"))}}, "does not match"},
		{"invalid object", map[string]any{"reference_images": []any{map[string]any{"src": "https://example.com/a.png"}}}, "invalid media value"},
		{"mixed url and upload", map[string]any{"reference_images": []any{"https://example.com/a.png", pngURI}}, "cannot mix"},
		{"frame URL must be png", map[string]any{"first_frame": "https://example.com/frame.jpg"}, "PNG"},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			err := validateH3Media(test.request)
			require.ErrorContains(t, err, test.message)
		})
	}
}
