# Simple Certificate API Testing Script
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
    Write-Host "Login successful! User ID: $userId" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "Login failed, attempting registration..." -ForegroundColor Yellow
    try {
        $registerBody = @{
            email = $email
            password = $password
            fullName = "Test User 2"
        } | ConvertTo-Json
        
        $registerResponse = Invoke-RestMethod -Uri "$baseUrl/api/mobile/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
        $token = $registerResponse.token
        $userId = $registerResponse.user.id
        Write-Host "Registration successful! User ID: $userId" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "Registration failed: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

$headers = @{
    Authorization = "Bearer $token"
}

# Step 2: Get available properties
Write-Host "2. Getting available properties..." -ForegroundColor Yellow
$propertyId = $null
$propertyTitle = $null
try {
    # Properties endpoint is public, try without auth first
    try {
        $propertiesResponse = Invoke-RestMethod -Uri "$baseUrl/api/mobile/properties?limit=5" -Method Get
    } catch {
        # If that fails, try with auth headers
        $propertiesResponse = Invoke-RestMethod -Uri "$baseUrl/api/mobile/properties?limit=5" -Method Get -Headers $headers
    }
    $properties = $propertiesResponse.data
    if ($properties -and $properties.Count -gt 0) {
        $propertyId = $properties[0].id
        $propertyTitle = $properties[0].title
        Write-Host "Found property: $propertyTitle ($propertyId)" -ForegroundColor Green
        Write-Host "  Token Price: $($properties[0].tokenPrice)" -ForegroundColor Gray
        Write-Host "  Available Tokens: $($properties[0].availableTokens)" -ForegroundColor Gray
        Write-Host ""
    } else {
        Write-Host "No properties available." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Failed to get properties: $($_.Exception.Message)" -ForegroundColor Red
    # Use a known property ID from earlier test for certificate testing
    $propertyId = "20ef4cc1-3453-4fd5-8fcf-157588d9cbbe"
    $propertyTitle = "Afraz Heights"
    Write-Host "Using known property ID for testing: $propertyId" -ForegroundColor Yellow
    Write-Host ""
}

# Step 3: Check wallet balance and deposit if needed
Write-Host "3. Checking wallet balance..." -ForegroundColor Yellow
$walletBalance = 0
try {
    $walletResponse = Invoke-RestMethod -Uri "$baseUrl/api/mobile/wallet" -Method Get -Headers $headers
    if ($walletResponse.data) {
        $walletBalance = $walletResponse.data.usdc
    } elseif ($walletResponse.usdc) {
        $walletBalance = $walletResponse.usdc
    } else {
        $walletBalance = 0
    }
    Write-Host "Current wallet balance: $walletBalance USDC" -ForegroundColor Green
    Write-Host ""
    
    # If balance is low, add test funds directly via wallet update (for testing only)
    if ($walletBalance -lt 1000) {
        Write-Host "3a. Adding test funds via wallet update (testing only)..." -ForegroundColor Yellow
        try {
            # Get wallet by user ID
            $walletInfo = Invoke-RestMethod -Uri "$baseUrl/wallet/user/$userId" -Method Get -Headers $headers
            if ($walletInfo -and $walletInfo.id) {
                $walletId = $walletInfo.id
                $currentBalance = [decimal]$walletInfo.balanceUSDT
                $newBalance = $currentBalance + 10000
                
                $updateBody = @{
                    balanceUSDT = $newBalance
                    totalDepositedUSDT = 10000
                } | ConvertTo-Json
                
                $updateResponse = Invoke-RestMethod -Uri "$baseUrl/wallet/$walletId" -Method Patch -Body $updateBody -ContentType "application/json" -Headers $headers
                Write-Host "Test funds added successfully!" -ForegroundColor Green
                Write-Host "  New balance: $newBalance USDC" -ForegroundColor Gray
                Write-Host ""
                
                # Refresh wallet balance
                $walletResponse = Invoke-RestMethod -Uri "$baseUrl/api/mobile/wallet" -Method Get -Headers $headers
                if ($walletResponse.data) {
                    $walletBalance = $walletResponse.data.usdc
                } elseif ($walletResponse.usdc) {
                    $walletBalance = $walletResponse.usdc
                }
                Write-Host "Updated wallet balance: $walletBalance USDC" -ForegroundColor Green
                Write-Host ""
            } else {
                Write-Host "Could not retrieve wallet information" -ForegroundColor Yellow
                Write-Host ""
            }
        } catch {
            Write-Host "Failed to add test funds: $($_.Exception.Message)" -ForegroundColor Yellow
            if ($_.Exception.Response) {
                try {
                    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                    $responseBody = $reader.ReadToEnd()
                    Write-Host "  Response: $responseBody" -ForegroundColor Gray
                } catch {
                    # Ignore stream read errors
                }
            }
            Write-Host ""
        }
    }
} catch {
    Write-Host "Failed to get wallet: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Step 4: Get user's transactions
Write-Host "4. Getting user transactions..." -ForegroundColor Yellow
$transactionId = $null
try {
    $transactionsResponse = Invoke-RestMethod -Uri "$baseUrl/api/mobile/transactions" -Method Get -Headers $headers
    $transactions = $transactionsResponse.data
    if (-not $transactions) {
        $transactions = $transactionsResponse.transactions
    }
    if ($transactions -and $transactions.Count -gt 0) {
        $investmentTransactions = $transactions | Where-Object { $_.type -eq "investment" -and $_.status -eq "completed" }
        if ($investmentTransactions -and $investmentTransactions.Count -gt 0) {
            $transactionId = $investmentTransactions[0].id
            Write-Host "Found investment transaction: $transactionId" -ForegroundColor Green
            Write-Host ""
        } else {
            Write-Host "No completed investment transactions found." -ForegroundColor Yellow
            Write-Host ""
        }
    } else {
        Write-Host "No transactions found." -ForegroundColor Yellow
        Write-Host ""
    }
} catch {
    Write-Host "Failed to get transactions: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Step 5: Create investment if we have property but no transactions
if ($propertyId -and !$transactionId -and $walletBalance -gt 0) {
    Write-Host "5. Attempting to create investment for testing..." -ForegroundColor Yellow
    try {
        # Get property details to check token price
        $propertyDetails = Invoke-RestMethod -Uri "$baseUrl/api/mobile/properties/$propertyId" -Method Get -Headers $headers
        $tokenPrice = $propertyDetails.data.tokenPrice
        $availableTokens = $propertyDetails.data.availableTokens
        
        # Calculate minimum investment (1 token or what we can afford)
        $minTokens = 1
        $maxAffordableTokens = [math]::Floor($walletBalance / $tokenPrice)
        $tokenCount = [math]::Min($minTokens, $maxAffordableTokens)
        
        if ($tokenCount -gt 0 -and $availableTokens -ge $tokenCount) {
            $investmentBody = @{
                propertyId = $propertyId
                tokenCount = $tokenCount
            } | ConvertTo-Json
            
            $investmentResponse = Invoke-RestMethod -Uri "$baseUrl/api/mobile/investments" -Method Post -Body $investmentBody -ContentType "application/json" -Headers $headers
            Write-Host "Investment created successfully!" -ForegroundColor Green
            Write-Host "  Investment ID: $($investmentResponse.id)" -ForegroundColor Gray
            Write-Host "  Tokens: $tokenCount" -ForegroundColor Gray
            Write-Host ""
            
            # Wait a moment for transaction to be processed
            Start-Sleep -Seconds 2
            
            # Get the transaction ID
            $transactionsResponse = Invoke-RestMethod -Uri "$baseUrl/api/mobile/transactions" -Method Get -Headers $headers
            $transactions = $transactionsResponse.data
            if (-not $transactions) {
                $transactions = $transactionsResponse.transactions
            }
            if ($transactions -and $transactions.Count -gt 0) {
                $investmentTransactions = $transactions | Where-Object { $_.type -eq "investment" -and $_.status -eq "completed" }
                if ($investmentTransactions -and $investmentTransactions.Count -gt 0) {
                    $transactionId = $investmentTransactions[0].id
                    Write-Host "Found new investment transaction: $transactionId" -ForegroundColor Green
                    Write-Host ""
                }
            }
        } else {
            Write-Host "Cannot create investment: insufficient balance or tokens unavailable" -ForegroundColor Yellow
            Write-Host "  Required: $($tokenPrice * $minTokens) USDC, Available: $walletBalance USDC" -ForegroundColor Gray
            Write-Host ""
        }
    } catch {
        Write-Host "Failed to create investment: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "  Response: $responseBody" -ForegroundColor Gray
        }
        Write-Host ""
    }
} elseif ($propertyId -and !$transactionId) {
    Write-Host "5. Skipping investment creation (insufficient wallet balance)" -ForegroundColor Yellow
    Write-Host ""
}

# Step 6: Test Transaction Certificate
if ($transactionId) {
    Write-Host "4. Testing Transaction Certificate..." -ForegroundColor Yellow
    Write-Host "   Endpoint: GET /api/mobile/certificates/transactions/$transactionId" -ForegroundColor Gray
    try {
        $certResponse = Invoke-RestMethod -Uri "$baseUrl/api/mobile/certificates/transactions/$transactionId" -Method Get -Headers $headers
        Write-Host "SUCCESS! Transaction certificate retrieved!" -ForegroundColor Green
        Write-Host "  Success: $($certResponse.success)" -ForegroundColor Gray
        Write-Host "  Transaction ID: $($certResponse.transactionId)" -ForegroundColor Gray
        Write-Host "  PDF URL: $($certResponse.pdfUrl)" -ForegroundColor Gray
        Write-Host ""
    } catch {
        Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            Write-Host "  Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
        }
        Write-Host ""
    }
} else {
    Write-Host "6. Skipping Transaction Certificate test (no transaction found)" -ForegroundColor Yellow
    Write-Host ""
}

# Step 7: Test Property Legal Document
if ($propertyId) {
    Write-Host "7. Testing Property Legal Document..." -ForegroundColor Yellow
    Write-Host "   Endpoint: GET /api/mobile/certificates/properties/$propertyId/legal-document" -ForegroundColor Gray
    try {
        $legalDocResponse = Invoke-RestMethod -Uri "$baseUrl/api/mobile/certificates/properties/$propertyId/legal-document" -Method Get -Headers $headers
        Write-Host "SUCCESS! Property legal document retrieved!" -ForegroundColor Green
        Write-Host "  Success: $($legalDocResponse.success)" -ForegroundColor Gray
        Write-Host "  Property ID: $($legalDocResponse.propertyId)" -ForegroundColor Gray
        Write-Host "  PDF URL: $($legalDocResponse.pdfUrl)" -ForegroundColor Gray
        Write-Host ""
    } catch {
        if ($_.Exception.Response -and $_.Exception.Response.StatusCode.value__ -eq 404) {
            Write-Host "Expected: Property legal document not found (404)" -ForegroundColor Yellow
            Write-Host "  This is normal if no legal document has been uploaded." -ForegroundColor Gray
        } else {
            Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
            if ($_.Exception.Response) {
                Write-Host "  Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
            }
        }
        Write-Host ""
    }
} else {
    Write-Host "7. Skipping Property Legal Document test (no property found)" -ForegroundColor Yellow
    Write-Host ""
}

# Step 8: Test Portfolio Summary
if ($propertyId) {
    Write-Host "8. Testing Portfolio Summary Certificate..." -ForegroundColor Yellow
    Write-Host "   Endpoint: GET /api/mobile/certificates/portfolio/$propertyId" -ForegroundColor Gray
    try {
        $portfolioResponse = Invoke-RestMethod -Uri "$baseUrl/api/mobile/certificates/portfolio/$propertyId" -Method Get -Headers $headers
        Write-Host "SUCCESS! Portfolio summary certificate generated!" -ForegroundColor Green
        Write-Host "  Success: $($portfolioResponse.success)" -ForegroundColor Gray
        Write-Host "  Property ID: $($portfolioResponse.propertyId)" -ForegroundColor Gray
        Write-Host "  PDF URL: $($portfolioResponse.pdfUrl)" -ForegroundColor Gray
        Write-Host "  Certificate Path: $($portfolioResponse.certificatePath)" -ForegroundColor Gray
        Write-Host ""
    } catch {
        if ($_.Exception.Response -and $_.Exception.Response.StatusCode.value__ -eq 404) {
            Write-Host "Expected: No investments found for this property (404)" -ForegroundColor Yellow
            Write-Host "  This is normal if the user has not invested in this property yet." -ForegroundColor Gray
        } else {
            Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
            if ($_.Exception.Response) {
                Write-Host "  Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
            }
        }
        Write-Host ""
    }
} else {
    Write-Host "8. Skipping Portfolio Summary test (no property found)" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "=== Testing Complete ===" -ForegroundColor Cyan

