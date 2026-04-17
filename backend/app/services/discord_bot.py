import discord
import asyncio
from app.core.config import settings
from app.agent.graph import aura_graph

class AuraDiscordClient(discord.Client):
    async def on_ready(self):
        print(f'Logged on as {self.user}!')

    async def on_message(self, message):
        if message.author == self.user:
            return

        # 1. COMMAND: !status
        if message.content.startswith('!status'):
            await message.channel.send('✅ **AURA Command Center** is online and monitoring.')
            return

        # 2. COMMAND: !accept <ticket_id>
        if message.content.startswith('!accept'):
            # RBAC CHECK: Only allow users with "Officer" role
            has_officer_role = any(role.name == "Officer" for role in message.author.roles)
            if not has_officer_role:
                await message.channel.send(
                    f"🚨 **CYBERSECURITY VIOLATION** 🚨\n"
                    f"⚠️ Unauthorized access attempt by **{message.author.name}**\n"
                    f"🚫 **Action Blocked:** Access to verified Officers only.\n"
                )
                return

            parts = message.content.split()
            if len(parts) < 2:
                await message.channel.send("❌ Please provide a Ticket ID: `!accept <id>`")
                return
            
            ticket_id = parts[-1]
            from app.core.database import AsyncSessionLocal
            from app.models.complaint import Complaint
            from app.services.twilio_service import send_whatsapp_update
            
            async with AsyncSessionLocal() as session:
                complaint = await session.get(Complaint, ticket_id)
                if not complaint:
                    await message.channel.send(f"❌ Ticket `{ticket_id}` not found.")
                    return
                
                complaint.status = "in_progress"
                await session.commit()
                
                await message.channel.send(f"👷 **{message.author.name}** has accepted Ticket `{ticket_id}`. Citizen notified.")
                
                if complaint.source == "whatsapp":
                    await session.refresh(complaint, ["citizen"])
                    if complaint.citizen and complaint.citizen.contact_id:
                        send_whatsapp_update(
                            complaint.citizen.contact_id, 
                            f"👷 Officer {message.author.name} (Discord) has accepted your grievance!"
                        )
            return

        # 3. COMMAND: !resolved <ticket_id>
        if message.content.startswith('!resolved'):
            # RBAC CHECK
            has_officer_role = any(role.name == "Officer" for role in message.author.roles)
            if not has_officer_role:
                await message.channel.send("🚨 **SECURITY ALERT** 🚨 Unauthorized resolve attempt.")
                return

            parts = message.content.split()
            if len(parts) < 2:
                await message.channel.send("❌ Please provide a Ticket ID: `!resolved <id>`")
                return
            
            ticket_id = parts[-1]

            from app.core.database import AsyncSessionLocal
            from app.models.complaint import Complaint
            from app.services.twilio_service import send_whatsapp_update
            from datetime import datetime
            
            async with AsyncSessionLocal() as session:
                complaint = await session.get(Complaint, ticket_id)
                if not complaint:
                    await message.channel.send(f"❌ Ticket `{ticket_id}` not found.")
                    return
                
                complaint.status = "resolved"
                complaint.resolved_at = datetime.utcnow()
                await session.commit()
                
                await message.channel.send(f"✅ **{message.author.name}** has resolved Ticket `{ticket_id}`. Citizen notified.")
                
                if complaint.source == "whatsapp":
                    await session.refresh(complaint, ["citizen"])
                    if complaint.citizen and complaint.citizen.contact_id:
                        send_whatsapp_update(
                            complaint.citizen.contact_id, 
                            f"✅ Your grievance (ID: {ticket_id[:8]}) has been RESOLVED! Thank you for using AURA."
                        )
            return

        # 4. IGNORE RAW COMMANDS (Prevents Security Alerts)
        if message.content.lower().startswith(('accept', 'resolved')):
            return

        # 5. Process everything else through the Graph

        initial_state = {
            "original_text": message.content,
            "image_url": message.attachments[0].url if message.attachments else None,
            "source": "discord",
            "sender_id": str(message.author.id),
            "history": [],
            "is_safe": True
        }

        try:
            final_state = await aura_graph.ainvoke(initial_state)
            
            if not final_state.get("is_safe"):
                await message.channel.send(f"🚨 Security Alert: {final_state.get('rejection_reason')}")
            else:
                category = final_state.get("category", "General")
                severity = final_state.get("severity", "Medium")
                comp_id = final_state.get("complaint_id", "N/A")
                await message.channel.send(f"✅ **AURA Logged:** {category} | Severity: {severity} | Status: assigned\n🎫 **Ticket ID:** `{comp_id}`")
        except Exception as e:
            print(f"Discord Bot Error: {e}")
            await message.channel.send("⚠️ Error processing your request.")


# Singleton instance
intents = discord.Intents.default()
intents.message_content = True
client = AuraDiscordClient(intents=intents)

async def start_discord_bot():
    """
    Runs the Discord bot in the background.
    """
    if settings.DISCORD_BOT_TOKEN == "placeholder_discord_token":
        print("Discord Bot Token is missing. Skipping bot startup.")
        return
    
    try:
        await client.start(settings.DISCORD_BOT_TOKEN)
    except Exception as e:
        print(f"Failed to start Discord Bot: {e}")
