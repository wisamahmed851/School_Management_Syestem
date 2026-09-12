Add-Type -AssemblyName System.Net.Http

function Invoke-Api($client, $method, $url, $jsonBody = $null) {
    if ($method -eq 'GET') {
        $resp = $client.GetAsync($url).Result
    } else {
        $c = New-Object System.Net.Http.StringContent($jsonBody, [System.Text.Encoding]::UTF8, "application/json")
        $resp = $client.PostAsync($url, $c).Result
    }
    return $resp.Content.ReadAsStringAsync().Result | ConvertFrom-Json
}

$BASE = "http://localhost:3000"

# Super admin client
$SA = New-Object System.Net.Http.HttpClient
$tok = (Invoke-Api $SA 'POST' "$BASE/admin/login" '{"email":"admin@gmail.com","password":"123456789"}').access_token
$SA.DefaultRequestHeaders.Add("Authorization", "Bearer $tok")
Write-Host "Super admin logged in."

# Get permission map
$perms = (Invoke-Api $SA 'GET' "$BASE/admin/permissions/index").data
$m = @{}; foreach ($p in $perms) { $m[$p.name] = $p.id }

# --- CREATE admin4 with ONLY guardians.update ---
Add-Type -AssemblyName System.Net.Http
$mc = New-Object System.Net.Http.MultipartFormDataContent
$mc.Add((New-Object System.Net.Http.StringContent("Guardians Only")), "name")
$mc.Add((New-Object System.Net.Http.StringContent("guardians.only@school.com")), "email")
$mc.Add((New-Object System.Net.Http.StringContent("Test@1234")), "password")
$cr = $SA.PostAsync("$BASE/admin/store", $mc).Result
$admin4 = $cr.Content.ReadAsStringAsync().Result | ConvertFrom-Json
$admin4Id = $admin4.data.id
Write-Host "Created admin4 id=$admin4Id email=guardians.only@school.com"

# Assign ONLY guardians.update to admin4
$gUpdateId = $m['guardians.update']
$r = Invoke-Api $SA 'POST' "$BASE/admin/permission-assigning-admin/store" "{`"admin_id`":$admin4Id,`"permission_id`":$gUpdateId}"
Write-Host "Assigned guardians.update (id=$gUpdateId) => $($r.message)"

# Login as admin4
$A4 = New-Object System.Net.Http.HttpClient
$tok4 = (Invoke-Api $A4 'POST' "$BASE/admin/login" '{"email":"guardians.only@school.com","password":"Test@1234"}').access_token
$A4.DefaultRequestHeaders.Add("Authorization", "Bearer $tok4")
Write-Host "Admin4 logged in."

# --- GET /admin/me/menu for SUPER ADMIN ---
$superMenu = Invoke-Api $SA 'GET' "$BASE/admin/me/menu"
Write-Host ""
Write-Host "============================================================"
Write-Host "SUPER ADMIN /me/menu  (all groups, all items, all actions=true)"
Write-Host "============================================================"
$superMenu.data | ConvertTo-Json -Depth 8

# --- GET /admin/me/menu for ADMIN4 (guardians.update only) ---
$a4Menu = Invoke-Api $A4 'GET' "$BASE/admin/me/menu"
Write-Host ""
Write-Host "============================================================"
Write-Host "ADMIN4 /me/menu  (only Guardians visible, only update=true)"
Write-Host "============================================================"
$a4Menu.data | ConvertTo-Json -Depth 8
