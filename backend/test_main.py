
import pytest
from fastapi.testclient import TestClient
import main


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(main, "DB", tmp_path / "test.db")

    with TestClient(main.app) as test_client:
        yield test_client


@pytest.fixture
def product():
    return {
        "name": "Wireless Mouse",
        "sku": "MOUSE-001",
        "quantity": 25,
        "price": 799.0,
        "category": "Electronics"
    }


def test_health(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_create_product(client, product):
    response = client.post("/products", json=product)

    assert response.status_code == 201
    assert response.json()["name"] == product["name"]
    assert response.json()["sku"] == product["sku"]


def test_get_product(client, product):
    created = client.post("/products", json=product)
    product_id = created.json()["id"]

    response = client.get(f"/products/{product_id}")

    assert response.status_code == 200
    assert response.json()["id"] == product_id


def test_update_product(client, product):
    created = client.post("/products", json=product)
    product_id = created.json()["id"]

    updated = product.copy()
    updated["quantity"] = 50

    response = client.put(f"/products/{product_id}", json=updated)

    assert response.status_code == 200
    assert response.json()["quantity"] == 50


def test_delete_product(client, product):
    created = client.post("/products", json=product)
    product_id = created.json()["id"]

    response = client.delete(f"/products/{product_id}")

    assert response.status_code == 204
    assert client.get(f"/products/{product_id}").status_code == 404


def test_search_products(client, product):
    client.post("/products", json=product)

    response = client.get("/products", params={"q": "Wireless"})

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["name"] == "Wireless Mouse"


def test_duplicate_sku(client, product):
    client.post("/products", json=product)

    duplicate = product.copy()
    duplicate["name"] = "Another Mouse"

    response = client.post("/products", json=duplicate)

    assert response.status_code == 409


def test_duplicate_sku_case_insensitive(client, product):
    client.post("/products", json=product)

    duplicate = product.copy()
    duplicate["sku"] = "mouse-001"

    response = client.post("/products", json=duplicate)

    assert response.status_code == 409


def test_negative_quantity(client, product):
    product["quantity"] = -5

    response = client.post("/products", json=product)

    assert response.status_code == 422


def test_negative_price(client, product):
    product["price"] = -100

    response = client.post("/products", json=product)

    assert response.status_code == 422


def test_product_not_found(client):
    response = client.get("/products/9999")

    assert response.status_code == 404


def test_update_duplicate_sku(client, product):
    client.post("/products", json=product)

    second_product = product.copy()
    second_product["sku"] = "MOUSE-002"
    second_product["name"] = "Gaming Mouse"

    created = client.post("/products", json=second_product)
    product_id = created.json()["id"]

    response = client.put(f"/products/{product_id}", json=product)

    assert response.status_code == 409
