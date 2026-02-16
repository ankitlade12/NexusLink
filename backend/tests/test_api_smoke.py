import unittest

from fastapi.testclient import TestClient

from main import app


class APISmokeTests(unittest.TestCase):
    def test_inventory_contract_includes_forecast_and_recommendations(self):
        with TestClient(app) as client:
            demo_resp = client.post("/api/demo-mode", json={"enabled": True})
            self.assertEqual(demo_resp.status_code, 200)

            response = client.get("/inventory")
            self.assertEqual(response.status_code, 200)
            payload = response.json()

            self.assertIn("inventory", payload)
            self.assertIn("recommendations", payload)
            self.assertIn("demo_mode", payload)
            self.assertTrue(payload["demo_mode"])
            self.assertGreater(len(payload["inventory"]), 0)

            first_item = payload["inventory"][0]
            self.assertIn("stockout_forecast", first_item)
            self.assertIn("risk_7d", first_item["stockout_forecast"])
            self.assertIn("risk_14d", first_item["stockout_forecast"])

    def test_health_score_range(self):
        with TestClient(app) as client:
            response = client.get("/api/health")
            self.assertEqual(response.status_code, 200)
            payload = response.json()

            self.assertIn("score", payload)
            self.assertGreaterEqual(payload["score"], 0)
            self.assertLessEqual(payload["score"], 100)

    def test_sync_action_mutates_discrepant_sku(self):
        with TestClient(app) as client:
            client.post("/api/demo-mode", json={"enabled": True})
            before = client.get("/inventory").json()
            discrepant = next((item for item in before["inventory"] if item.get("discrepancy")), None)
            self.assertIsNotNone(discrepant, "Seed should include at least one discrepant SKU")

            sku_id = discrepant["id"]
            action_resp = client.post("/api/action", json={"action": f"sync_inventory:{sku_id}"})
            self.assertEqual(action_resp.status_code, 200)
            self.assertEqual(action_resp.json().get("status"), "success")

            after = client.get("/inventory").json()
            updated = next(item for item in after["inventory"] if item["id"] == sku_id)
            self.assertFalse(updated["discrepancy"])
            self.assertEqual(updated["systems"]["shopify"], updated["systems"]["wms"])
            self.assertEqual(updated["systems"]["amazon"], updated["systems"]["wms"])


if __name__ == "__main__":
    unittest.main()
