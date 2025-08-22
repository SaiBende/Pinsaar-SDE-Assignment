Write-Host "=== DropLater Assignment Test Script ===`n"

# --- Config ---
$api = "http://localhost:8000"
$token = "my-secret-api-token"

# 1. Health check
Write-Host "`n[1] Checking API health..."
$health = curl "$api/health" | ConvertFrom-Json
$health | Format-List

# 2. Create a note with past releaseAt → should deliver quickly
Write-Host "`n[2] Creating a note with past releaseAt..."
$pastBody = '{
  "title": "Past Note",
  "body": "Should deliver immediately",
  "releaseAt": "2020-01-01T00:00:10.000Z",
  "webhookUrl": "http://sink:4000/sink"
}'
$pastNote = curl -Method POST "$api/api/notes" `
  -Headers @{ "Authorization"="Bearer $token"; "Content-Type"="application/json" } `
  -Body $pastBody | ConvertFrom-Json
$pastId = $pastNote._id
Write-Host "Past Note created: $pastId"

# 3. Create a note with future releaseAt → should stay pending
Write-Host "`n[3] Creating a note with future releaseAt..."
$futureDate = (Get-Date).AddMinutes(5).ToString("yyyy-MM-ddTHH:mm:ss.000Z")
$futureBody = "{
  `"title`": `"Future Note`",
  `"body`": `"Should stay pending`",
  `"releaseAt`": `"$futureDate`",
  `"webhookUrl`": `"http://sink:4000/sink`"
}"
$futureNote = curl -Method POST "$api/api/notes" `
  -Headers @{ "Authorization"="Bearer $token"; "Content-Type"="application/json" } `
  -Body $futureBody | ConvertFrom-Json
$futureId = $futureNote._id
Write-Host "Future Note created: $futureId"

# 4. List notes (page=1, pending)
Write-Host "`n[4] Listing pending notes..."
curl -Headers @{ "Authorization"="Bearer $token" } `
"$api/api/notes?status=pending&page=1"

# 5. Replay dead/failed note (force test)
Write-Host "`n[5] Replaying the past note (simulated failed/dead)..."
if ($pastId) {
  curl -Method POST `
    -Headers @{ "Authorization"="Bearer $token" } `
    "$api/api/notes/$pastId/replay"
} else {
  Write-Host "No past noteId found to replay!"
}

# 6. Idempotency test → send same note again
Write-Host "`n[6] Creating duplicate note to check idempotency..."
$dupNote = curl -Method POST "$api/api/notes" `
  -Headers @{ "Authorization"="Bearer $token"; "Content-Type"="application/json" } `
  -Body $pastBody | ConvertFrom-Json
Write-Host "Duplicate Note response:" $dupNote

# 7. Rate limit test → spam with 10 requests
Write-Host "`n[7] Rate limit test (expect 429 if limit works)..."
for ($i = 1; $i -le 10; $i++) {
  $res = curl -Method GET "$api/health" `
    -Headers @{ "Authorization"="Bearer $token" }
  Write-Host "Try $i → $res"
}

# 8. Show sink logs
Write-Host "`n[8] Fetching sink logs..."
docker logs sink --tail 20

Write-Host "`n=== Test Completed ==="
