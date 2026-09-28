# iOS Implementation Recipe

HumanReviewerInitials: PME

## 1. Configure dependencies and identity

1. Set iOS 17 or the chosen supported deployment target and a unique bundle ID.
2. Add FirebaseCore and FirebaseAuth Swift packages; add GoogleSignIn if required.
3. Register that bundle ID in Firebase and add its `GoogleService-Info.plist` to the app target.
4. Configure the reversed-client-ID URL scheme and initialize Firebase before `Auth.auth()`.
5. Implement an observable session that gates the camera on signed-in state.

## 2. Configure the API

Put the HTTPS base URL in build configuration/Info.plist, validate scheme and host at launch, and construct one API client. Do not embed OpenAI keys, Firebase Admin credentials, or the retired shared client token.

## 3. Capture JPEG bytes

```swift
let settings = AVCapturePhotoSettings(
    format: [AVVideoCodecKey: AVVideoCodecType.jpeg]
)
photoOutput.capturePhoto(with: settings, delegate: delegate)
// delegate: guard let jpeg = photo.fileDataRepresentation() else { ... }
```

Convert library/HEIC inputs to JPEG and enforce a client-side size policy before upload. Retain the JPEG for a retry only as long as the screen needs it.

## 4. Build and send the request

```swift
let token = try await Auth.auth().currentUser!.getIDToken()
var request = URLRequest(url: baseURL.appendingPathComponent("inspections"))
request.httpMethod = "POST"
request.setValue("application/json", forHTTPHeaderField: "Content-Type")
request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
request.httpBody = try JSONEncoder().encode(payload)
let (data, response) = try await URLSession.shared.data(for: request)
```

Encode the exact five-field contract. Never put `ownerId` in the payload. Treat only `2xx` plus a decodable, mode-matching report as success.

## 5. Drive UI state

Use explicit idle, analyzing, report-ready, and failure states. Disable duplicate capture during a request, ignore stale responses after navigation/retry, offer retry with the retained JPEG, and clear retained bytes when leaving the flow.
