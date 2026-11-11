# Webhooks

TODO: Describe how to register a webhook endpoint and how deliveries are signed and retried.

> Example payloads on this page are illustrative placeholders until the schema is finalised.

## Delivery

Each event is sent as an HTTP `POST` with a JSON body to your registered URL. Respond with any `2xx` status to acknowledge it.

| Header              | Description                         |
|---------------------|-------------------------------------|
| `X-Event-Type`      | The event name, e.g. `booking.created` |
| `X-Event-Id`        | Unique ID for idempotency           |
| `X-Signature`       | TODO — signature scheme             |

{% code title="Delivery request" %}
```http
POST /your/webhook/endpoint
Content-Type: application/json
X-Event-Type: booking.created
X-Event-Id: evt_01HZX5B3TQ
```
{% endcode %}

## booking.created

Sent when a new booking is confirmed.

{% code title="Payload" %}
```json
{
  "id": "evt_01HZX5B3TQ",
  "type": "booking.created",
  "createdAt": "2026-11-02T09:12:45Z",
  "data": {
    "id": "bk_01HZX4Q8M2",
    "status": "confirmed",
    "startsAt": "2026-11-14T18:00:00+01:00",
    "participants": 6,
    "total": { "amount": 129000, "currency": "SEK" }
  }
}
```
{% endcode %}

## booking.cancelled

Sent when a booking is cancelled by the customer or the venue.

{% code title="Payload" %}
```json
{
  "id": "evt_01HZX9K2PA",
  "type": "booking.cancelled",
  "createdAt": "2026-11-05T15:40:02Z",
  "data": {
    "id": "bk_01HZX4Q8M2",
    "status": "cancelled",
    "cancelledBy": "customer",
    "reason": null
  }
}
```
{% endcode %}
