# Certificate API Testing Script
# Run this in PowerShell: .\test-certificates.ps1

$baseUrl = "http://localhost:3000"
$email = "testuser2@gmail.com"
$password = "12345678"

Write-Host "=== Certificate API Testing ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Login
Write-Host "1. Logging in..." -ForegroundColor Yellow
$loginBody = @{
    email = $email
    password = $password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/mobile/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    $userId = $loginResponse.user.id
    Write-Host "✓ Login successful!" -ForegroundColor Green
    Write-Host "  User ID: $userId" -ForegroundColor Gray
    Write-Host "  Token: $($token.Substring(0, 50))..." -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "✗ Login failed: $_" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
    exit 1
}

# Step 2: Get user's transactions
Write-Host "2. Getting user transactions..." -ForegroundColor Yellow
$headers = @{
    Authorization = "Bearer $token"
}

try {
    $transactions = Invoke-RestMethod -Uri "$baseUrl/api/mobile/transactions" -Method Get -Headers $headers
    if ($transactions.transactions -and $transactions.transactions.Count -gt 0) {
        $transactionId = $transactions.transactions[0].id
        Write-Host "✓ Found transaction: $transactionId" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "⚠ No transactions found. You'll need to make an investment first." -ForegroundColor Yellow
        $transactionId = $null
    }
} catch {
    Write-Host "✗ Failed to get transactions: $_" -ForegroundColor Red
    $transactionId = $null
}

# Step 3: Get user's properties (for portfolio test)
Write-Host "3. Getting user properties..." -ForegroundColor Yellow
try {
    $properties = Invoke-RestMethod -Uri "$baseUrl/api/mobile/properties" -Method Get -Headers $headers
    if ($properties.properties -and $properties.properties.Count -gt 0) {
        $propertyId = $properties.properties[0].id
        Write-Host "✓ Found property: $propertyId" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "⚠ No properties found." -ForegroundColor Yellow
        $propertyId = $null
    }
} catch {
    Write-Host "✗ Failed to get properties: $_" -ForegroundColor Red
    $propertyId = $null
}

# Step 4: Test Transaction Certificate
if ($transactionId) {
    Write-Host "4. Testing Transaction Certificate..." -ForegroundColor Yellow
    try {
        $certResponse = Invoke-RestMethod -Uri "$baseUrl/api/mobile/certificates/transactions/$transactionId" -Method Get -Headers $headers
        Write-Host "✓ Transaction certificate retrieved!" -ForegroundColor Green
        Write-Host "  PDF URL: $($certResponse.pdfUrl)" -ForegroundColor Gray
        Write-Host ""
    } catch {
        Write-Host "✗ Failed to get transaction certificate: $_" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
    }
} else {
    Write-Host "4. Skipping Transaction Certificate test (no transaction found)" -ForegroundColor Yellow
    Write-Host ""
}

# Step 5: Test Property Legal Document
if ($propertyId) {
    Write-Host "5. Testing Property Legal Document..." -ForegroundColor Yellow
    try {
        $legalDocResponse = Invoke-RestMethod -Uri "$baseUrl/api/mobile/certificates/properties/$propertyId/legal-document" -Method Get -Headers $headers
        Write-Host "✓ Property legal document retrieved!" -ForegroundColor Green
        Write-Host "  PDF URL: $($legalDocResponse.pdfUrl)" -ForegroundColor Gray
        Write-Host ""
    } catch {
        if ($_.Exception.Response.StatusCode -eq 404) {
            Write-Host "⚠ Property legal document not found (404) - This is expected if no document is uploaded" -ForegroundColor Yellow
        } else {
            Write-Host "✗ Failed to get property legal document: $_" -ForegroundColor Red
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
    try {
        $portfolioResponse = Invoke-RestMethod -Uri "$baseUrl/api/mobile/certificates/portfolio/$propertyId" -Method Get -Headers $headers
        Write-Host "✓ Portfolio summary certificate generated!" -ForegroundColor Green
        Write-Host "  PDF URL: $($portfolioResponse.pdfUrl)" -ForegroundColor Gray
        Write-Host "  Certificate Path: $($portfolioResponse.certificatePath)" -ForegroundColor Gray
        Write-Host ""
    } catch {
        if ($_.Exception.Response.StatusCode -eq 404) {
            Write-Host "⚠ No investments found for this property (404)" -ForegroundColor Yellow
        } else {
            Write-Host "✗ Failed to generate portfolio summary: $_" -ForegroundColor Red
            Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        }
        Write-Host ""
    }
} else {
    Write-Host "6. Skipping Portfolio Summary test (no property found)" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "=== Testing Complete ===" -ForegroundColor Cyan

