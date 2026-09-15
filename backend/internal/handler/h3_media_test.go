package handler

import (
	"bytes"
	"encoding/base64"
	"encoding/binary"
	"encoding/json"
	"mime/multipart"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/stretchr/testify/require"
)

var tinyPNG = []byte{0x89, 'P', 'N', 'G', 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 'I', 'E', 'N', 'D'}

func tinyMP4WithDuration(seconds uint32) []byte {
	ftyp := append([]byte{0, 0, 0, 20}, []byte("ftypisom")...)
	ftyp = append(ftyp, []byte{0, 0, 0, 0, 'i', 's', 'o', 'm'}...)
	mvhdPayload := make([]byte, 20)
	binary.BigEndian.PutUint32(mvhdPayload[12:16], 1000)
	binary.BigEndian.PutUint32(mvhdPayload[16:20], seconds*1000)
	mvhd := make([]byte, 8+len(mvhdPayload))
	binary.BigEndian.PutUint32(mvhd[:4], uint32(len(mvhd)))
	copy(mvhd[4:8], "mvhd")
	copy(mvhd[8:], mvhdPayload)
	moov := make([]byte, 8+len(mvhd))
	binary.BigEndian.PutUint32(moov[:4], uint32(len(moov)))
	copy(moov[4:8], "moov")
	copy(moov[8:], mvhd)
	return append(ftyp, moov...)
}

func TestBuildH3UpstreamRequestKeepsTextOnlyJSON(t *testing.T) {
	body, contentType, err := buildH3UpstreamRequest(map[string]any{
		"prompt": "A paper boat", "model": miniMaxH3Model,
	}, 5, "2k", nil)
	require.NoError(t, err)
	require.Equal(t, "application/json", contentType)
	var got map[string]any
	require.NoError(t, json.Unmarshal(body, &got))
	require.Equal(t, "2544x1456", got["size"])
	require.Equal(t, float64(5), got["duration"])
	require.NotContains(t, got, "seconds")
	require.NotContains(t, got, "input_reference")
}

func TestBuildH3UpstreamRequestEncodesReferenceMediaAsDCAPIJSON(t *testing.T) {
	pngURI := "data:image/png;base64," + base64.StdEncoding.EncodeToString(tinyPNG)
	mp4 := tinyMP4WithDuration(2)
	mp4URI := "data:video/mp4;base64," + base64.StdEncoding.EncodeToString(mp4)
	mp3URI := "data:audio/mpeg;base64," + base64.StdEncoding.EncodeToString([]byte("ID3audio"))
	body, contentType, err := buildH3UpstreamRequest(map[string]any{
		"prompt":           "Follow the references",
		"reference_images": []any{pngURI},
		"reference_videos": []any{mp4URI},
		"reference_audios": []any{mp3URI},
	}, 5, "2k", func(field string, value h3MediaValue) (string, error) {
		switch field {
		case "input_reference":
			return "https://www.ownapi.dev/v1/video-inputs/image_token", nil
		case "reference_videos":
			return "https://www.ownapi.dev/v1/video-inputs/video_token", nil
		default:
			return "https://www.ownapi.dev/v1/video-inputs/audio_token", nil
		}
	})
	require.NoError(t, err)
	require.Equal(t, "application/json", contentType)
	var got map[string]any
	require.NoError(t, json.Unmarshal(body, &got))
	require.Equal(t, []any{map[string]any{"url": "https://www.ownapi.dev/v1/video-inputs/image_token"}}, got["reference_images"])
	require.Equal(t, []any{map[string]any{"url": "https://www.ownapi.dev/v1/video-inputs/video_token"}}, got["reference_videos"])
	require.Equal(t, []any{map[string]any{"url": "https://www.ownapi.dev/v1/video-inputs/audio_token"}}, got["reference_audios"])
}

func TestBuildH3UpstreamRequestStagesUploadedImageWithPublicURL(t *testing.T) {
	temp := t.TempDir() + "/reference.png"
	require.NoError(t, os.WriteFile(temp, tinyPNG, 0o600))
	body, contentType, err := buildH3UpstreamRequest(map[string]any{
		"prompt": "Animate", "input_reference": []any{&h3UploadedMedia{Path: temp, MIME: "image/png", Name: "reference.png", Size: int64(len(tinyPNG))}},
	}, 5, "768p", func(field string, value h3MediaValue) (string, error) {
		require.Equal(t, "input_reference", field)
		return "https://www.ownapi.dev/v1/video-inputs/image_token", nil
	})
	require.NoError(t, err)
	require.Equal(t, "application/json", contentType)
	var got map[string]any
	require.NoError(t, json.Unmarshal(body, &got))
	require.Equal(t, []any{map[string]any{"url": "https://www.ownapi.dev/v1/video-inputs/image_token"}}, got["reference_images"])
}

func TestBuildH3UpstreamRequestConvertsUploadedImageToDataURI(t *testing.T) {
	temp := t.TempDir() + "/reference.png"
	require.NoError(t, os.WriteFile(temp, tinyPNG, 0o600))
	body, contentType, err := buildH3UpstreamRequest(map[string]any{
		"prompt": "Animate", "input_reference": []any{&h3UploadedMedia{Path: temp, MIME: "image/png", Name: "reference.png", Size: int64(len(tinyPNG))}},
	}, 5, "768p", nil)
	require.NoError(t, err)
	require.Equal(t, "application/json", contentType)
	var got map[string]any
	require.NoError(t, json.Unmarshal(body, &got))
	require.Equal(t, []any{map[string]any{"url": "data:image/png;base64," + base64.StdEncoding.EncodeToString(tinyPNG)}}, got["reference_images"])
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

func TestValidateH3UploadedReferenceVideoDuration(t *testing.T) {
	tests := []struct {
		name    string
		seconds uint32
		wantErr string
	}{
		{name: "minimum", seconds: 2},
		{name: "maximum", seconds: 15},
		{name: "too short", seconds: 1, wantErr: "2 through 15 seconds"},
		{name: "too long", seconds: 16, wantErr: "2 through 15 seconds"},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			path := t.TempDir() + "/reference.mp4"
			data := tinyMP4WithDuration(test.seconds)
			require.NoError(t, os.WriteFile(path, data, 0o600))
			err := validateH3UploadedMedia("reference_videos", &h3UploadedMedia{
				Path: path, MIME: "video/mp4", Name: "reference.mp4", Size: int64(len(data)),
			})
			if test.wantErr == "" {
				require.NoError(t, err)
			} else {
				require.ErrorContains(t, err, test.wantErr)
			}
		})
	}
}

func TestValidateH3DataURIReferenceVideoDuration(t *testing.T) {
	for _, test := range []struct {
		name    string
		seconds uint32
		wantErr string
	}{
		{name: "minimum", seconds: 2},
		{name: "maximum", seconds: 15},
		{name: "too short", seconds: 1, wantErr: "2 through 15 seconds"},
		{name: "too long", seconds: 16, wantErr: "2 through 15 seconds"},
	} {
		t.Run(test.name, func(t *testing.T) {
			value := "data:video/mp4;base64," + base64.StdEncoding.EncodeToString(tinyMP4WithDuration(test.seconds))
			err := validateH3MediaValue("reference_videos", h3MediaValue{Text: value})
			if test.wantErr == "" {
				require.NoError(t, err)
			} else {
				require.ErrorContains(t, err, test.wantErr)
			}
		})
	}
}
