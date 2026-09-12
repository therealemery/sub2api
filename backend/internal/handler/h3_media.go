package handler

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"mime"
	"mime/multipart"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

const (
	maxH3ImageBytes = 20 << 20
	maxH3VideoBytes = 50 << 20
	maxH3AudioBytes = 15 << 20
	// Keep one request below 96 MiB even when several media fields are used.
	// Browser uploads are spooled to private temporary files so their bytes are
	// not duplicated as Base64 while the request is being validated.
	maxVideoRequestBytes = 96 << 20
)

var h3MediaAliases = map[string]string{
	"input_reference":   "input_reference",
	"reference_images":  "input_reference",
	"reference_videos":  "reference_videos",
	"reference_audios":  "reference_audios",
	"first_frame":       "first_frame",
	"first_frame_image": "first_frame",
	"last_frame":        "last_frame",
	"last_frame_image":  "last_frame",
}

type videoRequestError struct{ message string }

type h3UploadedMedia struct {
	Path string
	MIME string
	Name string
	Size int64
}

func (e *videoRequestError) Error() string { return e.message }

func parseVideoCreateRequest(r *http.Request) (map[string]any, error) {
	contentType := strings.TrimSpace(r.Header.Get("Content-Type"))
	mediaType, params, err := mime.ParseMediaType(contentType)
	if err != nil && contentType != "" {
		return nil, &videoRequestError{message: "Invalid Content-Type"}
	}
	if mediaType != "multipart/form-data" {
		body, readErr := io.ReadAll(io.LimitReader(r.Body, maxVideoRequestBytes+1))
		if readErr != nil || len(body) > maxVideoRequestBytes {
			return nil, &videoRequestError{message: "Video request is too large"}
		}
		var request map[string]any
		if json.Unmarshal(body, &request) != nil {
			return nil, &videoRequestError{message: "Invalid JSON body"}
		}
		return request, nil
	}
	boundary := params["boundary"]
	if boundary == "" {
		return nil, &videoRequestError{message: "Invalid multipart body"}
	}
	request := make(map[string]any)
	createdFiles := make([]string, 0, 4)
	cleanupOnError := func() {
		for _, path := range createdFiles {
			_ = os.Remove(path)
		}
	}
	reader := multipart.NewReader(io.LimitReader(r.Body, maxVideoRequestBytes+1), boundary)
	var total int64
	for {
		part, nextErr := reader.NextPart()
		if nextErr == io.EOF {
			break
		}
		if nextErr != nil {
			cleanupOnError()
			return nil, &videoRequestError{message: "Invalid multipart body"}
		}
		name := part.FormName()
		if name == "" {
			_ = part.Close()
			continue
		}
		limit := int64(8 << 10)
		if _, ok := h3MediaAliases[name]; ok {
			limit = mediaLimitForField(name)
		}
		if part.FileName() != "" {
			if _, ok := h3MediaAliases[name]; !ok {
				_ = part.Close()
				cleanupOnError()
				return nil, &videoRequestError{message: "File uploads are only allowed for reference media"}
			}
			temp, tempErr := os.CreateTemp("", "ownapi-h3-media-*")
			if tempErr != nil {
				_ = part.Close()
				cleanupOnError()
				return nil, &videoRequestError{message: "Unable to process uploaded media"}
			}
			createdFiles = append(createdFiles, temp.Name())
			written, copyErr := io.Copy(temp, io.LimitReader(part, limit+1))
			closeErr := temp.Close()
			_ = part.Close()
			if copyErr != nil || closeErr != nil || written > limit {
				cleanupOnError()
				return nil, &videoRequestError{message: fmt.Sprintf("%s exceeds its size limit", name)}
			}
			total += written
			if total > maxVideoRequestBytes {
				cleanupOnError()
				return nil, &videoRequestError{message: "Video request is too large"}
			}
			declared := strings.TrimSpace(part.Header.Get("Content-Type"))
			if declared == "" || declared == "application/octet-stream" {
				probeFile, openErr := os.Open(temp.Name())
				if openErr != nil {
					cleanupOnError()
					return nil, &videoRequestError{message: "Unable to inspect uploaded media"}
				}
				probe, _ := io.ReadAll(io.LimitReader(probeFile, 512))
				_ = probeFile.Close()
				declared = http.DetectContentType(probe)
			}
			appendRequestValue(request, name, &h3UploadedMedia{Path: temp.Name(), MIME: strings.ToLower(strings.Split(declared, ";")[0]), Name: filepath.Base(part.FileName()), Size: written})
			continue
		}
		data, readErr := io.ReadAll(io.LimitReader(part, limit+1))
		_ = part.Close()
		if readErr != nil || int64(len(data)) > limit {
			cleanupOnError()
			return nil, &videoRequestError{message: fmt.Sprintf("%s exceeds its size limit", name)}
		}
		total += int64(len(data))
		if total > maxVideoRequestBytes {
			cleanupOnError()
			return nil, &videoRequestError{message: "Video request is too large"}
		}
		value := string(data)
		appendRequestValue(request, name, value)
	}
	return request, nil
}

func cleanupVideoCreateRequest(request map[string]any) {
	for field := range h3MediaAliases {
		for _, value := range h3MediaValues(request[field]) {
			if value.Upload != nil {
				_ = os.Remove(value.Upload.Path)
			}
		}
	}
}

func appendRequestValue(request map[string]any, name string, value any) {
	if _, media := h3MediaAliases[name]; media {
		if current, ok := request[name].([]any); ok {
			request[name] = append(current, value)
		} else if current, ok := request[name]; ok {
			request[name] = []any{current, value}
		} else {
			request[name] = []any{value}
		}
		return
	}
	if text, ok := value.(string); ok && (name == "duration" || name == "seconds") {
		if number, err := strconv.ParseFloat(text, 64); err == nil {
			request[name] = number
			return
		}
	}
	request[name] = value
}

func mediaLimitForField(field string) int64 {
	switch h3MediaAliases[field] {
	case "reference_videos":
		return maxH3VideoBytes
	case "reference_audios":
		return maxH3AudioBytes
	default:
		return maxH3ImageBytes
	}
}

type h3MediaURLBuilder func(field string, value h3MediaValue) (string, error)

func buildH3UpstreamRequest(request map[string]any, duration int, resolution string, buildMediaURL h3MediaURLBuilder) ([]byte, string, error) {
	if err := validateH3Media(request); err != nil {
		return nil, "", err
	}
	body, err := buildH3JSONRequest(request, duration, resolution, buildMediaURL)
	return body, "application/json", err
}

func validateH3Media(request map[string]any) error {
	for field := range h3MediaAliases {
		if raw, exists := request[field]; exists && raw != nil && len(h3MediaValues(raw)) == 0 {
			if items, ok := raw.([]any); ok && len(items) == 0 {
				continue
			}
			return fmt.Errorf("%s contains an invalid media value", field)
		}
	}
	images := append(h3MediaValues(request["input_reference"]), h3MediaValues(request["reference_images"])...)
	videos := h3MediaValues(request["reference_videos"])
	audios := h3MediaValues(request["reference_audios"])
	first := append(h3MediaValues(request["first_frame"]), h3MediaValues(request["first_frame_image"])...)
	last := append(h3MediaValues(request["last_frame"]), h3MediaValues(request["last_frame_image"])...)
	if len(images) > 9 {
		return fmt.Errorf("at most 9 reference images are allowed")
	}
	if len(videos) > 3 {
		return fmt.Errorf("at most 3 reference videos are allowed")
	}
	if len(audios) > 3 {
		return fmt.Errorf("at most 3 reference audios are allowed")
	}
	if len(first) > 1 || len(last) > 1 {
		return fmt.Errorf("only one first and last frame is allowed")
	}
	if len(images)+len(videos)+len(audios)+len(first)+len(last) > 12 {
		return fmt.Errorf("at most 12 reference inputs are allowed")
	}
	if len(audios) > 0 && len(images) == 0 {
		return fmt.Errorf("reference audio requires at least one reference image")
	}
	if len(first)+len(last) > 0 && len(images)+len(videos)+len(audios) > 0 {
		return fmt.Errorf("first/last frame cannot be combined with reference media")
	}
	for _, group := range []struct {
		field  string
		values []h3MediaValue
	}{
		{"input_reference", images}, {"reference_videos", videos}, {"reference_audios", audios},
		{"first_frame", first}, {"last_frame", last},
	} {
		if mixesH3MediaKinds(group.values) {
			return fmt.Errorf("%s cannot mix URLs and uploaded media", group.field)
		}
		for _, value := range group.values {
			if err := validateH3MediaValue(group.field, value); err != nil {
				return err
			}
		}
	}
	return nil
}

type h3MediaValue struct {
	Text   string
	Upload *h3UploadedMedia
}

func h3MediaValues(value any) []h3MediaValue {
	if value == nil {
		return nil
	}
	items, ok := value.([]any)
	if !ok {
		items = []any{value}
	}
	out := make([]h3MediaValue, 0, len(items))
	for _, item := range items {
		switch typed := item.(type) {
		case string:
			out = append(out, h3MediaValue{Text: typed})
		case *h3UploadedMedia:
			out = append(out, h3MediaValue{Upload: typed})
		case map[string]any:
			if text, ok := typed["url"].(string); ok {
				out = append(out, h3MediaValue{Text: text})
			}
		}
	}
	return out
}

func mixesH3MediaKinds(values []h3MediaValue) bool {
	hasURL, hasFile := false, false
	for _, value := range values {
		if value.Upload != nil || strings.HasPrefix(strings.TrimSpace(value.Text), "data:") {
			hasFile = true
		} else {
			hasURL = true
		}
	}
	return hasURL && hasFile
}

func validateH3MediaValue(field string, value h3MediaValue) error {
	if value.Upload != nil {
		return validateH3UploadedMedia(field, value.Upload)
	}
	text := strings.TrimSpace(value.Text)
	if strings.HasPrefix(text, "data:") {
		mediaType, data, err := decodeH3DataURI(text)
		if err != nil {
			return fmt.Errorf("invalid media data for %s", field)
		}
		if err := validateH3MediaBytes(field, mediaType, data); err != nil {
			return err
		}
		return nil
	}
	parsed, err := url.Parse(text)
	if err != nil || parsed.Scheme != "https" || parsed.Hostname() == "" || parsed.User != nil {
		return fmt.Errorf("%s must contain direct HTTPS URLs or supported uploads", field)
	}
	if (field == "first_frame" || field == "last_frame") && !strings.EqualFold(filepath.Ext(parsed.Path), ".png") {
		return fmt.Errorf("%s must be a PNG image", field)
	}
	return nil
}

func validateH3UploadedMedia(field string, upload *h3UploadedMedia) error {
	if upload == nil || upload.Size <= 0 || upload.Size > mediaLimitForField(field) {
		return fmt.Errorf("unsupported or oversized media for %s", field)
	}
	file, err := os.Open(upload.Path)
	if err != nil {
		return fmt.Errorf("unable to read media for %s", field)
	}
	defer func() { _ = file.Close() }()
	probe, err := io.ReadAll(io.LimitReader(file, 512))
	if err != nil {
		return fmt.Errorf("unable to read media for %s", field)
	}
	if err := validateH3MediaBytes(field, upload.MIME, probe); err != nil {
		return err
	}
	ext := strings.ToLower(filepath.Ext(upload.Name))
	allowedExtension := map[string]map[string]bool{
		"reference_videos": {".mp4": true},
		"reference_audios": {".mp3": true},
		"first_frame":      {".png": true}, "last_frame": {".png": true},
		"input_reference": {".png": true, ".jpg": true, ".jpeg": true},
	}
	if extensions := allowedExtension[field]; extensions != nil && !extensions[ext] {
		return fmt.Errorf("unsupported file extension for %s", field)
	}
	return nil
}

func decodeH3DataURI(value string) (string, []byte, error) {
	comma := strings.IndexByte(value, ',')
	if comma <= 5 {
		return "", nil, fmt.Errorf("invalid data URI")
	}
	header, encoded := value[5:comma], value[comma+1:]
	parts := strings.Split(header, ";")
	if len(parts) < 2 || parts[len(parts)-1] != "base64" {
		return "", nil, fmt.Errorf("data URI must be base64 encoded")
	}
	data, err := base64.StdEncoding.DecodeString(encoded)
	return strings.ToLower(strings.TrimSpace(parts[0])), data, err
}

func validateH3MediaBytes(field, mediaType string, data []byte) error {
	allowed := map[string]bool{}
	switch field {
	case "reference_videos":
		allowed["video/mp4"] = true
	case "reference_audios":
		allowed["audio/mpeg"] = true
	case "first_frame", "last_frame":
		allowed["image/png"] = true
	default:
		allowed["image/png"], allowed["image/jpeg"] = true, true
	}
	if !allowed[mediaType] || len(data) == 0 {
		return fmt.Errorf("unsupported or oversized media for %s", field)
	}
	sniffed := strings.ToLower(strings.Split(http.DetectContentType(data), ";")[0])
	if mediaType == "audio/mpeg" {
		if !strings.HasPrefix(string(data), "ID3") && (len(data) <= 1 || data[0] != 0xff || data[1]&0xe0 != 0xe0) {
			return fmt.Errorf("media content does not match %s", mediaType)
		}
	} else if mediaType == "video/mp4" {
		if len(data) < 12 || string(data[4:8]) != "ftyp" {
			return fmt.Errorf("media content does not match %s", mediaType)
		}
	} else if sniffed != mediaType {
		return fmt.Errorf("media content does not match %s", mediaType)
	}
	return nil
}

func h3RequestSize(request map[string]any, resolution string) string {
	if size := strings.TrimSpace(stringValue(request["size"])); strings.Contains(size, "x") {
		return size
	}
	if resolution == "2k" {
		return "2544x1456"
	}
	return "1344x768"
}

func stringValue(value any) string {
	text, _ := value.(string)
	return text
}
