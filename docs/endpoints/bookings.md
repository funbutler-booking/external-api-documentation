# Bookings

TODO: Describe the bookings resource.

> Example payloads on this page are illustrative placeholders until the schema is finalised.

## List bookings

`GET /v1/bookings`

Returns bookings whose start time falls within the given range.

| Parameter | Type   | Description                              |
|-----------|--------|------------------------------------------|
| `from`    | string | TODO — ISO 8601 date, e.g. `2026-11-01`  |
| `to`      | string | TODO — ISO 8601 date, e.g. `2026-11-30`  |

{% code title="Request" %}
```http
GET /v1/bookings?from=2026-11-01&to=2026-11-30
Authorization: Bearer <your-api-key>
Accept: application/json
```
{% endcode %}

{% code title="Response · 200 OK" %}
```json
{
  "data": [
    {
      "id": "bk_01HZX4Q8M2",
      "status": "confirmed",
      "startsAt": "2026-11-14T18:00:00+01:00",
      "endsAt": "2026-11-14T19:30:00+01:00",
      "activity": { "id": "act_bowling", "name": "Bowling" },
      "participants": 6,
      "customer": {
        "name": "Alex Example",
        "email": "alex@example.com",
        "phone": "+46700000000"
      },
      "total": { "amount": 129000, "currency": "SEK" },
      "createdAt": "2026-11-02T09:12:44Z"
    }
  ],
  "nextCursor": null
}
```
{% endcode %}

{% code title="Response · 401" %}
```json
{
  "error": {
    "code": "unauthorized",
    "message": "Missing or invalid API key."
  }
}
```
{% endcode %}
