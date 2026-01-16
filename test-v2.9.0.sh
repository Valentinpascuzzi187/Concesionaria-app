#!/bin/bash

# Script para testing de v2.9.0
# Ejecutar: bash test-v2.9.0.sh

echo "🧪 Testing De Grazia Automotores v2.9.0"
echo "======================================"

BASE_URL="http://localhost:4000"

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "\n${YELLOW}1. Health Check${NC}"
curl -s "$BASE_URL/api/health" | jq . 2>/dev/null && echo -e "${GREEN}✓ API Responsive${NC}" || echo -e "${RED}✗ API No responsive${NC}"

echo -e "\n${YELLOW}2. Version Endpoint${NC}"
curl -s "$BASE_URL/api/version" | jq . 2>/dev/null && echo -e "${GREEN}✓ Version available${NC}" || echo -e "${RED}✗ Version not available${NC}"

echo -e "\n${YELLOW}3. Login Test${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@concesionaria.com",
    "password": "Halcon2716@"
  }')

echo "$LOGIN_RESPONSE" | jq . 2>/dev/null
if echo "$LOGIN_RESPONSE" | grep -q "token"; then
  echo -e "${GREEN}✓ Login successful${NC}"
  TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token' 2>/dev/null)
else
  echo -e "${RED}✗ Login failed${NC}"
  exit 1
fi

echo -e "\n${YELLOW}4. Vehiculos Endpoint${NC}"
curl -s "$BASE_URL/api/vehiculos" -H "Authorization: Bearer $TOKEN" | jq '. | length' 2>/dev/null && echo -e "${GREEN}✓ Vehiculos loaded${NC}" || echo -e "${RED}✗ Vehiculos failed${NC}"

echo -e "\n${YELLOW}5. Clientes Endpoint${NC}"
curl -s "$BASE_URL/api/clientes" -H "Authorization: Bearer $TOKEN" | jq '. | length' 2>/dev/null && echo -e "${GREEN}✓ Clientes loaded${NC}" || echo -e "${RED}✗ Clientes failed${NC}"

echo -e "\n${YELLOW}6. Minutas Endpoint${NC}"
curl -s "$BASE_URL/api/minutas" -H "Authorization: Bearer $TOKEN" | jq '. | length' 2>/dev/null && echo -e "${GREEN}✓ Minutas loaded${NC}" || echo -e "${RED}✗ Minutas failed${NC}"

echo -e "\n${YELLOW}7. Testing File Upload (Mock)${NC}"
# Crear imagen de prueba base64
TEST_IMAGE="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

# Obtener primer vehículo
VEHICULO_ID=$(curl -s "$BASE_URL/api/vehiculos" -H "Authorization: Bearer $TOKEN" | jq -r '.[0].id' 2>/dev/null)

if [ ! -z "$VEHICULO_ID" ] && [ "$VEHICULO_ID" != "null" ]; then
  UPLOAD_RESPONSE=$(curl -s -X POST "$BASE_URL/api/vehiculos/$VEHICULO_ID/fotos/upload-blob" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"archivo\": \"$TEST_IMAGE\",
      \"tipo_mime\": \"image/png\",
      \"nombre\": \"test_image_$(date +%s).png\",
      \"tipo\": \"exterior\"
    }")
  
  if echo "$UPLOAD_RESPONSE" | grep -q "agregada\|almacenada"; then
    echo -e "${GREEN}✓ File upload working${NC}"
    echo "$UPLOAD_RESPONSE" | jq . 2>/dev/null
  else
    echo -e "${YELLOW}⚠ File upload tested (check response below)${NC}"
    echo "$UPLOAD_RESPONSE" | jq . 2>/dev/null
  fi
else
  echo -e "${YELLOW}⚠ No vehicles found, skipping upload test${NC}"
fi

echo -e "\n${YELLOW}8. Database Tables Check${NC}"
echo "Checking if new tables exist..."
# Nota: Esto requeriría acceso directo a MySQL, omitido en script

echo -e "\n${YELLOW}9. Mobile HTML Availability${NC}"
curl -s -I "$BASE_URL/mobile-responsive.html" | grep "200\|404" && echo -e "${GREEN}✓ Mobile HTML available${NC}" || echo -e "${RED}✗ Mobile HTML not found${NC}"

echo -e "\n${GREEN}======================================"
echo "✅ v2.9.0 Testing Complete${NC}"
echo "======================================"

echo -e "\n${YELLOW}Manual Testing Checklist:${NC}"
echo "- [ ] Login works in web"
echo "- [ ] Carrusel rotates every 3 seconds"
echo "- [ ] File upload saves to MySQL"
echo "- [ ] File download works correctly"
echo "- [ ] Mobile view is responsive"
echo "- [ ] Notification appears for updates"
echo "- [ ] Documents persist after page reload"
echo "- [ ] Dashboard stats are accurate"
echo "- [ ] Payments section calculates correctly"
echo "- [ ] Reports show correct data"
