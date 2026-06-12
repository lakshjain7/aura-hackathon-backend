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


SEVERITY_EMOJI = {"critical": "🔴", "high": "🟠", "medium": "🟡", "low": "🟢"}
COMPLAINT_CHANNEL_NAMES = ["aura-complaints", "complaints", "grievances", "aura", "general"]

_cached_invite_code: str = ""
_cached_server_name: str = ""


async def get_server_invite() -> dict:
    """
    Return a permanent invite for the Discord server.
    Returns dict: {code, url, server_name, guild_id}
    Always creates a new permanent invite if none exists.
    """
    global _cached_invite_code, _cached_server_name

    if not client.is_ready():
        return {}

    for guild in client.guilds:
        _cached_server_name = guild.name

        # Try existing permanent invite first
        try:
            invites = await guild.invites()
            for inv in invites:
                if inv.max_age == 0 and not inv.revoked:
                    _cached_invite_code = inv.code
                    return {
                        "code": inv.code,
                        "url": f"https://discord.gg/{inv.code}",
                        "server_name": guild.name,
                        "guild_id": str(guild.id),
                    }
        except Exception:
            pass

        # Create fresh permanent invite on the grievances channel, or first channel
        target_ch = discord.utils.get(guild.text_channels, name="grievances") or \
                    discord.utils.get(guild.text_channels, name="general") or \
                    (guild.text_channels[0] if guild.text_channels else None)

        if target_ch:
            try:
                inv = await target_ch.create_invite(
                    max_age=0, max_uses=0, unique=True,
                    reason="AURA community join — permanent invite"
                )
                _cached_invite_code = inv.code
                return {
                    "code": inv.code,
                    "url": f"https://discord.gg/{inv.code}",
                    "server_name": guild.name,
                    "guild_id": str(guild.id),
                }
            except Exception as e:
                print(f"Could not create invite: {e}")

    return {}


async def get_or_create_community_channel(channel_name: str, topic: str = "", user_name: str = "") -> dict:
    """
    Ensure a community channel exists in all guilds.
    Posts a join notification.
    Returns: {invite_url, invite_code, server_name, channel_name, channel_created}
    """
    if not client.is_ready():
        return {}

    invite_info = await get_server_invite()
    result = {**invite_info, "channel_name": channel_name, "channel_created": False}

    for guild in client.guilds:
        existing = discord.utils.get(guild.text_channels, name=channel_name)
        channel_created = False
        if not existing:
            try:
                existing = await guild.create_text_channel(
                    name=channel_name,
                    topic=f"AURA Community — {topic}" if topic else "AURA Community Channel",
                    reason="Auto-created by AURA platform",
                )
                channel_created = True
                result["channel_created"] = True
                print(f"Created Discord channel #{channel_name} in {guild.name}")
                await existing.send(
                    f"🎉 **#{channel_name}** community channel is now live on AURA!\n"
                    f"📋 Topic: **{topic or channel_name}**\n"
                    f"👤 First member: **{user_name or 'A citizen'}** joined via the AURA web portal."
                )
            except discord.Forbidden:
                print(f"No permission to create #{channel_name}")
                continue

        if not channel_created:
            # Post join notification (only if channel already existed)
            join_msg = f"👋 **{user_name or 'A new citizen'}** just joined this community via the AURA web portal!"
            try:
                await existing.send(join_msg)
            except discord.Forbidden:
                pass

    return result


async def notify_new_complaint(complaint_id: str, raw_text: str, severity: str, pincode: str = "", phone: str = ""):
    """Post a new web-filed complaint to the AURA complaints Discord channel."""
    if not client.is_ready():
        print("Discord bot not ready — skipping channel notification.")
        return

    sev_emoji = SEVERITY_EMOJI.get(severity.lower(), "🟡")
    short_id = complaint_id[:8] if len(complaint_id) >= 8 else complaint_id
    location_part = f" | 📍 Pincode: `{pincode}`" if pincode else ""
    phone_part = f" | 📱 `{phone}`" if phone else ""

    msg = (
        f"🆕 **New Complaint Filed via Web Portal**\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\n"
        f"🎫 **Ticket:** `{complaint_id}`\n"
        f"{sev_emoji} **Severity:** {severity.upper()}\n"
        f"💬 **Description:** {raw_text[:200]}{'...' if len(raw_text) > 200 else ''}\n"
        f"🌐 **Source:** Web Portal{location_part}{phone_part}\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\n"
        f"👮 Officers: use `!accept {short_id}` to take this ticket."
    )

    for guild in client.guilds:
        target_channel = None
        for name in COMPLAINT_CHANNEL_NAMES:
            target_channel = discord.utils.get(guild.text_channels, name=name)
            if target_channel:
                break
        if not target_channel and guild.text_channels:
            target_channel = guild.text_channels[0]
        if target_channel:
            try:
                await target_channel.send(msg)
                print(f"Discord complaint notification sent to #{target_channel.name} in {guild.name}")
            except discord.Forbidden:
                print(f"No permission to post in #{target_channel.name}")
