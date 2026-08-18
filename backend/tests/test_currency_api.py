"""
Tests for Currency Conversion API
Tests: Exchange rates, currency conversion, price formatting
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestCurrencyRates:
    """Test currency rates endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_get_exchange_rates(self):
        """Test GET /api/currency/rates returns exchange rates"""
        response = self.session.get(f"{BASE_URL}/api/currency/rates")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify base currency
        assert data.get("base") == "XOF", "Base currency should be XOF"
        
        # Verify rates structure
        assert "rates" in data, "Response should contain rates"
        rates = data["rates"]
        assert "XOF" in rates, "XOF rate should be present"
        assert "EUR" in rates, "EUR rate should be present"
        assert "USD" in rates, "USD rate should be present"
        
        # Verify XOF is base (rate = 1)
        assert rates["XOF"] == 1, "XOF rate should be 1 (base currency)"
        
        # Verify EUR and USD rates are reasonable (less than 1 since XOF is base)
        assert 0 < rates["EUR"] < 1, f"EUR rate should be between 0 and 1, got {rates['EUR']}"
        assert 0 < rates["USD"] < 1, f"USD rate should be between 0 and 1, got {rates['USD']}"
    
    def test_get_exchange_rates_currencies_list(self):
        """Test that currencies list is returned with proper structure"""
        response = self.session.get(f"{BASE_URL}/api/currency/rates")
        assert response.status_code == 200
        
        data = response.json()
        assert "currencies" in data, "Response should contain currencies list"
        
        currencies = data["currencies"]
        assert len(currencies) >= 3, "Should have at least 3 currencies"
        
        # Verify currency structure
        for currency in currencies:
            assert "code" in currency, "Currency should have code"
            assert "name" in currency, "Currency should have name"
            assert "symbol" in currency, "Currency should have symbol"
            assert "flag" in currency, "Currency should have flag"
        
        # Verify specific currencies
        codes = [c["code"] for c in currencies]
        assert "XOF" in codes, "XOF should be in currencies"
        assert "EUR" in codes, "EUR should be in currencies"
        assert "USD" in codes, "USD should be in currencies"


class TestCurrencyConversion:
    """Test currency conversion endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_convert_xof_to_eur(self):
        """Test POST /api/currency/convert XOF to EUR"""
        response = self.session.post(f"{BASE_URL}/api/currency/convert", json={
            "amount": 10000,
            "from_currency": "XOF",
            "to_currency": "EUR"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify response structure
        assert "original_amount" in data, "Response should have original_amount"
        assert "converted_amount" in data, "Response should have converted_amount"
        assert "from_currency" in data, "Response should have from_currency"
        assert "to_currency" in data, "Response should have to_currency"
        assert "rate" in data, "Response should have rate"
        assert "timestamp" in data, "Response should have timestamp"
        
        # Verify values
        assert data["original_amount"] == 10000, "Original amount should match input"
        assert data["from_currency"] == "XOF", "From currency should be XOF"
        assert data["to_currency"] == "EUR", "To currency should be EUR"
        
        # Verify conversion is reasonable (10000 XOF ~ 15 EUR)
        assert 10 < data["converted_amount"] < 25, f"Converted amount should be reasonable, got {data['converted_amount']}"
    
    def test_convert_xof_to_usd(self):
        """Test POST /api/currency/convert XOF to USD"""
        response = self.session.post(f"{BASE_URL}/api/currency/convert", json={
            "amount": 10000,
            "from_currency": "XOF",
            "to_currency": "USD"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data["from_currency"] == "XOF"
        assert data["to_currency"] == "USD"
        
        # Verify conversion is reasonable (10000 XOF ~ 16-18 USD)
        assert 10 < data["converted_amount"] < 25, f"Converted amount should be reasonable, got {data['converted_amount']}"
    
    def test_convert_eur_to_xof(self):
        """Test POST /api/currency/convert EUR to XOF (reverse conversion)"""
        response = self.session.post(f"{BASE_URL}/api/currency/convert", json={
            "amount": 15,
            "from_currency": "EUR",
            "to_currency": "XOF"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data["from_currency"] == "EUR"
        assert data["to_currency"] == "XOF"
        
        # Verify conversion is reasonable (15 EUR ~ 10000 XOF)
        assert 8000 < data["converted_amount"] < 12000, f"Converted amount should be reasonable, got {data['converted_amount']}"
    
    def test_convert_same_currency(self):
        """Test converting same currency returns same amount"""
        response = self.session.post(f"{BASE_URL}/api/currency/convert", json={
            "amount": 5000,
            "from_currency": "XOF",
            "to_currency": "XOF"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data["converted_amount"] == 5000, "Same currency conversion should return same amount"
        assert data["rate"] == 1, "Same currency rate should be 1"


class TestCurrencyFormat:
    """Test currency formatting endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_format_price_xof(self):
        """Test GET /api/currency/format/{amount} for XOF"""
        response = self.session.get(f"{BASE_URL}/api/currency/format/50000?currency=XOF")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "formatted" in data, "Response should have formatted price"
        assert "FCFA" in data["formatted"], "XOF format should contain FCFA"
        assert data["currency"] == "XOF"
    
    def test_format_price_eur(self):
        """Test GET /api/currency/format/{amount} for EUR"""
        response = self.session.get(f"{BASE_URL}/api/currency/format/50000?currency=EUR")
        assert response.status_code == 200
        
        data = response.json()
        assert "formatted" in data
        assert "€" in data["formatted"], "EUR format should contain €"
        assert data["currency"] == "EUR"
    
    def test_format_price_usd(self):
        """Test GET /api/currency/format/{amount} for USD"""
        response = self.session.get(f"{BASE_URL}/api/currency/format/50000?currency=USD")
        assert response.status_code == 200
        
        data = response.json()
        assert "formatted" in data
        assert "$" in data["formatted"], "USD format should contain $"
        assert data["currency"] == "USD"
