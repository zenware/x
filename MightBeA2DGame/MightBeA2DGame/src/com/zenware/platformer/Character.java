package com.zenware.platformer;

public class Character extends Entity {
	public boolean dead;
	public double coins;
	
	// Override this in the Player Class
	public boolean isEnemy() {
		return true;
	}
	
	public boolean isDead() {
		if (dead) {
			return true;
		} else {
			return false;
		}
	}
	
	public void explodeCoins(Character character) {
		if (character.isEnemy()) {
			System.out.println("Yay coins!");
			for (int i = 0; i < character.coins; i++) {
				Game.addCoin(new Coin(character.x, character.y));
			}
		} else {
			if (character.coins > 0) {
				System.out.println("Oh no, you lost " + character.coins + " coins!");
			}
			
			for (int i = 0; i < character.coins; i++) {
				Game.addCoin(new Coin(character.x, character.y));
			}
			character.coins = 0;
		}
	}
	
	public void killCharacter(Character character) {
		if (character.isEnemy()){
			System.out.println("You killed an enemy, how insignificant.");
		}
		if (!character.isDead()) {
			explodeCoins(character);
			character.die();
		}
	}
	
	public void die() {
		dead = true;
		yspeed = 4;
	}

	public void update(Character player) {
		// TODO Auto-generated method stub
		
	}

}
