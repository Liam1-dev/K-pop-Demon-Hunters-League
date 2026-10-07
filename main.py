"""K-pop Demon Hunters League CLI game.

A small playable prototype inspired by the repository's concept: build a hunter,
select a champion, fight rivals, earn gold, and climb the ranked ladder.
"""

from __future__ import annotations

import random
import sys
from dataclasses import dataclass, field


@dataclass
class Hunter:
    name: str
    archetype: str
    hp: int = 100
    attack: int = 16
    defense: int = 5
    gold: int = 40
    rank: int = 1
    wins: int = 0

    def heal(self, amount: int) -> None:
        self.hp = min(100, self.hp + amount)

    def take_damage(self, damage: int) -> None:
        actual = max(0, damage - self.defense)
        self.hp = max(0, self.hp - actual)

    def attack_move(self, opponent: "Hunter") -> int:
        damage = self.attack + random.randint(4, 12)
        opponent.take_damage(damage)
        return damage

    def special_move(self, opponent: "Hunter") -> int:
        burst = self.attack + random.randint(8, 18)
        opponent.take_damage(burst)
        return burst


CHARACTERS = {
    "1": {"name": "Nova Bloom", "attack": 18, "defense": 5, "hp": 100},
    "2": {"name": "Riot Mirage", "attack": 15, "defense": 7, "hp": 110},
    "3": {"name": "Velvet Viper", "attack": 20, "defense": 4, "hp": 95},
    "4": {"name": "Moonlight Mantis", "attack": 17, "defense": 6, "hp": 105},
}

RIVAL_NAMES = [
    "Jin Hwa",
    "Sora Byte",
    "Aiko Hex",
    "Kae Prism",
    "Mina Fang",
    "Rae Circuit",
]


def print_title() -> None:
    print("\n=====================================")
    print("      K-pop Demon Hunters League")
    print("=====================================")
    print("Battle for the ranked crown.")
    print("=====================================\n")


def choose_hunter() -> Hunter:
    print("Choose your champion:")
    for key, details in CHARACTERS.items():
        print(f"{key}. {details['name']} | ATK {details['attack']} | DEF {details['defense']} | HP {details['hp']}")

    while True:
        choice = input("Enter the number of your hunter: ").strip()
        if choice in CHARACTERS:
            details = CHARACTERS[choice]
            name = input("Enter your hunter name: ").strip() or "Player One"
            return Hunter(
                name=name,
                archetype=details["name"],
                hp=details["hp"],
                attack=details["attack"],
                defense=details["defense"],
            )
        print("Invalid choice. Pick a number from the list.")


def make_rival(rank: int) -> Hunter:
    name = random.choice(RIVAL_NAMES)
    base_attack = 10 + rank * 3
    base_defense = 3 + rank
    rival_hp = 80 + rank * 12
    return Hunter(name=name, archetype="Rival", hp=rival_hp, attack=base_attack, defense=base_defense)


def battle(player: Hunter, rival: Hunter) -> bool:
    print(f"\nBattle start: {player.name} vs {rival.name}")
    print(f"{player.name}: HP {player.hp}, ATK {player.attack}, DEF {player.defense}")
    print(f"{rival.name}: HP {rival.hp}, ATK {rival.attack}, DEF {rival.defense}")

    while player.hp > 0 and rival.hp > 0:
        print("\nChoose your move:")
        print("1. Basic Attack")
        print("2. Special Attack")
        print("3. Guard")
        print("4. Quit Match")

        move = input("> ").strip()

        if move == "4":
            print(f"{player.name} forfeits the match.")
            return False

        if move == "1":
            damage = player.attack_move(rival)
            print(f"{player.name} hits for {damage} damage.")
        elif move == "2":
            damage = player.special_move(rival)
            print(f"{player.name} unleashes a special move for {damage} damage.")
        elif move == "3":
            player.defense += 4
            print(f"{player.name} guards and boosts defense.")
            player.defense = min(player.defense, 20)
        else:
            print("Invalid move. Try again.")
            continue

        if rival.hp <= 0:
            break

        rival_action = random.choice(["attack", "special", "guard"])
        if rival_action == "attack":
            rival_damage = rival.attack_move(player)
            print(f"{rival.name} strikes for {rival_damage} damage.")
        elif rival_action == "special":
            rival_damage = rival.special_move(player)
            print(f"{rival.name} unleashes a burst for {rival_damage} damage.")
        else:
            rival.defense += 4
            print(f"{rival.name} guards and braces for impact.")

        print(f"{player.name} HP: {player.hp} | {rival.name} HP: {rival.hp}")

    if player.hp > 0:
        player.wins += 1
        player.gold += 30 + player.rank * 5
        player.rank += 1
        print(f"\nVictory! {player.name} wins and earns 30 + {player.rank - 1}*5 gold.")
        print(f"Current gold: {player.gold}")
        return True

    print(f"\nDefeat! {rival.name} takes the round.")
    player.gold = max(0, player.gold - 10)
    player.hp = max(20, player.hp)
    return False


def shop(player: Hunter) -> None:
    print("\nRanked shop")
    print("1. Upgrade attack (+4 damage) - 20 gold")
    print("2. Upgrade defense (+4 defense) - 20 gold")
    print("3. Restore health (+25 HP) - 15 gold")
    print("4. Leave shop")

    while True:
        choice = input("> ").strip()
        if choice == "1" and player.gold >= 20:
            player.gold -= 20
            player.attack += 4
            print("Attack upgraded.")
            break
        if choice == "2" and player.gold >= 20:
            player.gold -= 20
            player.defense += 4
            print("Defense upgraded.")
            break
        if choice == "3" and player.gold >= 15:
            player.gold -= 15
            player.heal(25)
            print("Health restored.")
            break
        if choice == "4":
            break
        print("Not enough gold or invalid input. Choose again.")


def display_summary(player: Hunter) -> None:
    print("\n=====================================")
    print("Hunter Summary")
    print(f"Name: {player.name}")
    print(f"Champion: {player.archetype}")
    print(f"Rank: {player.rank}")
    print(f"Wins: {player.wins}")
    print(f"Gold: {player.gold}")
    print(f"HP: {player.hp}")
    print("=====================================")


def main() -> None:
    print_title()
    player = choose_hunter()
    print(f"\nWelcome, {player.name}! Your journey begins as {player.archetype}.")

    while True:
        rival = make_rival(player.rank)
        outcome = battle(player, rival)

        if not outcome:
            print("\nThe ladder is unforgiving. Your hunter re-enters the arena.")

        if player.gold >= 15:
            shop_choice = input("Visit the shop? (y/n): ").strip().lower()
            if shop_choice in {"y", "yes"}:
                shop(player)

        display_summary(player)

        if player.rank >= 6:
            print("\nYou are now a top-tier demon hunter and have reached the league finals!")
            print("Congratulations, champion.")
            break

        play_again = input("Continue the ranked ladder? (y/n): ").strip().lower()
        if play_again not in {"y", "yes"}:
            print("\nYou chose to retire from the league. Until next time.")
            break

    print("\nThanks for playing K-pop Demon Hunters League!")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nGame interrupted. See you in the arena.")
        sys.exit(0)
