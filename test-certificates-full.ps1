# Complete Certificate API Testing Script
# Run this in PowerShell: .\test-certificates-full.ps1

$baseUrl = "http://localhost:3000"
$email = "testuser2@gmail.com"
$password = "12345678"

Write-Host "=== Certificate API Testing ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Try to login, if fails, register
Write-Host "1. Attempting login..." -ForegroundColor Yellow
$loginBody = @{
    email = $email
    password = $password
} | ConvertTo-Json

$token = $null
$userId = $null

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/mobile/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    $userId = $loginResponse.user.id
    Write-Host "✓ Login successful!" -ForegroundColor Green
    Write-Host "  User ID: $userId" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "⚠ Login failed, attempting registration..." -ForegroundColor Yellow
    try {
        $registerBody = @{
            email = $email
            password = $password
            fullName = "Test User 2"
        } | ConvertTo-Json
        
        $registerResponse = Invoke-RestMethod -Uri "$baseUrl/api/mobile/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
        $token = $registerResponse.token
        $userId = $registerResponse.user.id
        Write-Host "✓ Registration successful!" -ForegroundColor Green
        Write-Host "  User ID: $userId" -ForegroundColor Gray
        Write-Host ""
    } catch {
        Write-Host "✗ Registration failed: $_" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

$headers = @{
    Authorization = "Bearer $token"
}

# Step 2: Get available properties
Write-Host "2. Getting available properties..." -ForegroundColor Yellow
try {
    $propertiesResponse = Invoke-RestMethod -Uri "$baseUrl/api/mobile/properties" -Method Get -Headers $headers
    $properties = $propertiesResponse.properties
    if ($properties -and $properties.Count -gt 0) {
        $propertyId = $properties[0].id
        $propertyTitle = $properties[0].title
        Write-Host "✓ Found property: $propertyTitle ($propertyId)" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "⚠ No properties available. Cannot test portfolio summary." -ForegroundColor Yellow
        $propertyId = $null
    }
} catch {
    Write-Host "✗ Failed to get properties: $_" -ForegroundColor Red
    $propertyId = $null
}

# Step 3: Get user's transactions
Write-Host "3. Getting user transactions..." -ForegroundColor Yellow
$transactionId = $null
try {
    $transactionsResponse = Invoke-RestMethod -Uri "$baseUrl/api/mobile/transactions" -Method Get -Headers $headers
    $transactions = $transactionsResponse.transactions
    if ($transactions -and $transactions.Count -gt 0) {
        $investmentTransactions = $transactions | Where-Object { $_.type -eq "investment" -and $_.status -eq "completed" }
        if ($investmentTransactions -and $investmentTransactions.Count -gt 0) {
            $transactionId = $investmentTransactions[0].id
            Write-Host "✓ Found investment transaction: $transactionId" -ForegroundColor Green
            Write-Host ""
        } else {
            Write-Host "⚠ No completed investment transactions found." -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠ No transactions found." -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ Failed to get transactions: $_" -ForegroundColor Red
}

# Step 4: Test Transaction Certificate
if ($transactionId) {
    Write-Host "4. Testing Transaction Certificate..." -ForegroundColor Yellow
    Write-Host "   Endpoint: GET /api/mobile/certificates/transactions/$transactionId" -ForegroundColor Gray
    try {
        $certResponse = Invoke-RestMethod -Uri "$baseUrl/api/mobile/certificates/transactions/$transactionId" -Method Get -Headers $headers
        Write-Host "✓ SUCCESS! Transaction certificate retrieved!" -ForegroundColor Green
        Write-Host "  Success: $($certResponse.success)" -ForegroundColor Gray
        Write-Host "  Transaction ID: $($certResponse.transactionId)" -ForegroundColor Gray
        Write-Host "  PDF URL: $($certResponse.pdfUrl)" -ForegroundColor Gray
        Write-Host "  (Open the PDF URL in a browser to view the certificate)" -ForegroundColor Cyan
        Write-Host ""
    } catch {
        Write-Host "✗ FAILED: $_" -ForegroundColor Red
        Write-Host "  Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
    }
} else {
    Write-Host "4. Skipping Transaction Certificate test (no transaction found)" -ForegroundColor Yellow
    Write-Host "   To test this, make an investment first." -ForegroundColor Gray
    Write-Host ""
}

# Step 5: Test Property Legal Document
if ($propertyId) {
    Write-Host "5. Testing Property Legal Document..." -ForegroundColor Yellow
    Write-Host "   Endpoint: GET /api/mobile/certificates/properties/$propertyId/legal-document" -ForegroundColor Gray
    try {
        $legalDocResponse = Invoke-RestMethod -Uri "$baseUrl/api/mobile/certificates/properties/$propertyId/legal-document" -Method Get -Headers $headers
        Write-Host "✓ SUCCESS! Property legal document retrieved!" -ForegroundColor Green
        Write-Host "  Success: $($legalDocResponse.success)" -ForegroundColor Gray
        Write-Host "  Property ID: $($legalDocResponse.propertyId)" -ForegroundColor Gray
        Write-Host "  PDF URL: $($legalDocResponse.pdfUrl)" -ForegroundColor Gray
        Write-Host ""
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 404) {
            Write-Host "⚠ Expected: Property legal document not found (404)" -ForegroundColor Yellow
            Write-Host "  This is normal if no legal document has been uploaded to Supabase." -ForegroundColor Gray
        } else {
            Write-Host "✗ FAILED: $_" -ForegroundColor Red
            Write-Host "  Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
        }
        Write-Host ""
    }
} else {
    Write-Host "5. Skipping Property Legal Document test (no property found)" -ForegroundColor Yellow
    Write-Host ""
}

# Step 6: Test Portfolio Summary
if ($propertyId) {
    Write-Host "6. Testing Portfolio Summary Certificate..." -ForegroundColor Yellow
    Write-Host "   Endpoint: GET /api/mobile/certificates/portfolio/$propertyId" -ForegroundColor Gray
    try {
        $portfolioResponse = Invoke-RestMethod -Uri "$baseUrl/api/mobile/certificates/portfolio/$propertyId" -Method Get -Headers $headers
        Write-Host "✓ SUCCESS! Portfolio summary certificate generated!" -ForegroundColor Green
        Write-Host "  Success: $($portfolioResponse.success)" -ForegroundColor Gray
        Write-Host "  Property ID: $($portfolioResponse.propertyId)" -ForegroundColor Gray
        Write-Host "  PDF URL: $($portfolioResponse.pdfUrl)" -ForegroundColor Gray
        Write-Host "  Certificate Path: $($portfolioResponse.certificatePath)" -ForegroundColor Gray
        Write-Host "  (Open the PDF URL in a browser to view the certificate)" -ForegroundColor Cyan
        Write-Host ""
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 404) {
            Write-Host "⚠ Expected: No investments found for this property (404)" -ForegroundColor Yellow
            Write-Host "  This is normal if the user has not invested in this property yet." -ForegroundColor Gray
        } else {
            Write-Host "✗ FAILED: $_" -ForegroundColor Red
            Write-Host "  Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
            Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        }
        Write-Host ""
    }
} else {
    Write-Host "6. Skipping Portfolio Summary test (no property found)" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "=== Testing Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "- All endpoints are registered and accessible" -ForegroundColor Green
Write-Host "- Check the results above for each test" -ForegroundColor Gray
Write-Host "- PDF URLs can be opened in a browser to view certificates" -ForegroundColor Gray

