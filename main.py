import random
import json
import os

class SpecialAbility:
    def __init__(self, name, description, cost, action_type, value):
        self.name = name
        self.description = description
        self.cost = cost           # Mana or Energy cost
        self.action_type = action_type # "damage", "heal", or "shield"
        self.value = value         # Base power rating

class Character:
    def __init__(self, name, role, hp, attack, speed, max_energy, ability):
        self.name = name
        self.role = role
        self.hp = hp
        self.max_hp = hp
        self.attack = attack
        self.speed = speed
        self.energy = max_energy
        self.max_energy = max_energy
        self.ability = ability
        self.shield = 0

    def take_damage(self, amount):
        if self.shield > 0:
            if amount <= self.shield:
                self.shield -= amount
                amount = 0
            else:
                amount -= self.shield
                self.shield = 0
        self.hp = max(0, self.hp - amount)

    def use_ability(self, target):
        if self.energy >= self.ability.cost:
            self.energy -= self.ability.cost
            
            if self.ability.action_type == "damage":
                dmg = self.ability.value + random.randint(-2, 5)
                target.take_damage(dmg)
                return f"uses {self.name}'s ultimate [{self.ability.name}] dealing {dmg} critical damage!"
                
            elif self.ability.action_type == "heal":
                heal = self.ability.value
                self.hp = min(self.max_hp, self.hp + heal)
                return f"activates [{self.ability.name}] and heals for {heal} HP!"
                
            elif self.ability.action_type == "shield":
                self.shield += self.ability.value
                return f"casts [{self.ability.name}] gaining a {self.shield} point protection barrier!"
        return "tried to cast an ability but lacked enough Energy/Mana!"

    def is_alive(self):
        return self.hp > 0

    def reset(self):
        self.hp = self.max_hp
        self.energy = self.max_energy
        self.shield = 0

class HunterProfile:
    def __init__(self, username):
        self.username = username
        self.gold = 100
        self.rank_points = 1000
        self.active_main = "Rumi"

    # Save Your Soul - Profile persistence implementation
    def save_profile(self, filename="hunter_soul.json"):
        data = {
            "username": self.username,
            "gold": self.gold,
            "rank_points": self.rank_points,
            "active_main": self.active_main
        }
        with open(filename, "w") as f:
            json.dump(data, f, indent=4)
        print(f"💾 [Save Your Soul] Profile successfully preserved for {self.username}!")

    @classmethod
    def load_profile(cls, filename="hunter_soul.json"):
        if not os.path.exists(filename):
            print("⚠️ No saved soul database found. Creating a clean roster slate.")
            return None
        with open(filename, "r") as f:
            data = json.load(f)
        profile = cls(data["username"])
        profile.gold = data["gold"]
        profile.rank_points = data["rank_points"]
        profile.active_main = data["active_main"]
        print(f"🔮 [Save Your Soul] Successfully reloaded profile: {profile.username}")
        return profile

class CombatSystem:
    # Character Database Injection
    CHARACTERS = {
        "Rumi": lambda: Character("Rumi", "Assassin", 450, 65, 1.2, 100, 
                                  SpecialAbility("Phantom Drop", "High damage single-strike executing pierce", 60, "damage", 110)),
        "Jinu": lambda: Character("Jinu", "Mage", 500, 55, 0.9, 120, 
                                  SpecialAbility("Encore Barrier", "Generates an energy barrier to nullify incoming damage", 50, "shield", 90))
    }

    @classmethod
    def simulate_pvp(cls, h1, h2):
        c1 = cls.CHARACTERS[h1.active_main]()
        c2 = cls.CHARACTERS[h2.active_main]()
        
        print(f"\n⚔️ PVP ARENA: {h1.username} vs {h2.username} ⚔️")
        
        # Super simplified combat rounds demonstrating abilities
        round_cnt = 1
        while c1.is_alive() and c2.is_alive() and round_cnt <= 5:
            # Check for ultimate moves triggers
            if c1.energy >= c1.ability.cost and random.random() > 0.3:
                print(f"✨ {h1.username} {c1.use_ability(c2)}")
            else:
                c2.take_damage(c1.attack)
                
            if c2.is_alive():
                if c2.energy >= c2.ability.cost and random.random() > 0.3:
                    print(f"✨ {h2.username} {c2.use_ability(c1)}")
                else:
                    c1.take_damage(c2.attack)
            round_cnt += 1

        if c1.is_alive() and not c2.is_alive():
            h1.rank_points += 25
            h1.gold += 50
            return h1
        else:
            h2.rank_points += 25
            h2.gold += 50
            return h2

# --- Operational Demo Loop ---
if __name__ == "__main__":
    # Attempt to load a preserved soul file first
    player = HunterProfile.load_profile()
    
    if not player:
        # Create profile fresh if fallback file missing
        player = HunterProfile("Liam1_Dev")
        player.save_profile()

    # Generate test opponent profile 
    opponent = HunterProfile("ShadowStar")
    opponent.active_main = "Jinu"
    
    # Fight & award rewards
    winner = CombatSystem.simulate_pvp(player, opponent)
    print(f"\n🏆 Victory declared for {winner.username}!")
    
    # Save the modern states back to JSON disk structure
    player.save_profile()
