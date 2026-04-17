import discord
import asyncio
from app.core.config import settings
from app.agent.graph import aura_graph

class AuraDiscordClient(discord.Client):
    async def on_ready(self):
        print(f'Logged on as {self.user}!')

    async def on_message(self, message):
        # Ignore messages from the bot itself
        if message.author == self.user:
            return

        # Simple command to check status
        if message.content.startswith('!status'):
            await message.channel.send('AURA is online and monitoring.')
            return

        # Process everything else through the Graph
        # (Usually you'd filter for mentions or specific channels)
        print(f"Processing Discord Message: {message.content}")
        
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
                await message.channel.send(f"✅ **AURA Logged:** {category} | Severity: {severity} | Status: {final_state.get('status', 'assigned')}")
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
