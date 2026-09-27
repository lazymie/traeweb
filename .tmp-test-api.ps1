try {
  $body = '{"username":"admin","password":"admin123"}'
  $r = Invoke-WebRequest -Uri 'http://localhost:3001/api/auth/login' -Method Post -Body $body -ContentType 'application/json' -UseBasicParsing -TimeoutSec 5
  $data = $r.Content | ConvertFrom-Json
  $token = $data.data.token
  Write-Host ("TOKEN_OK")

  $h = @{ Authorization = "Bearer $token" }
  $r2 = Invoke-WebRequest -Uri 'http://localhost:3001/api/admin/stats' -Headers $h -UseBasicParsing -TimeoutSec 5
  Write-Host ("STATS_STATUS=" + $r2.StatusCode)
  $len = [Math]::Min(400, $r2.Content.Length)
  Write-Host ("STATS=" + $r2.Content.Substring(0, $len))
} catch {
  Write-Host ("ERR=" + $_.Exception.Message)
}
