from twilio.rest import Client
from app.core.config import settings

def send_whatsapp_update(to_number: str, message: str):
    """
    Sends an outbound WhatsApp message to a citizen.
    """
    # Simple check for sandbox numbers - Twilio Sandbox requires "whatsapp:" prefix
    if not to_number.startswith("whatsapp:"):
        formatted_to = f"whatsapp:{to_number}"
    else:
        formatted_to = to_number

    try:
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        
        message = client.messages.create(
            from_=settings.TWILIO_WHATSAPP_NUMBER,
            body=message,
            to=formatted_to
        )
        print(f"WhatsApp Update Sent to {formatted_to}: {message.sid}")
        return True
    except Exception as e:
        print(f"Twilio Outbound Error: {e}")
        return False
