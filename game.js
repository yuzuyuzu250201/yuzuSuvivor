// ========== 게임 설정 ==========
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scene: [MainMenu, Game]
};

const game = new Phaser.Game(config);

// ========== 메인 메뉴 씬 ==========
class MainMenu extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenu' });
    }

    create() {
        const w = 800, h = 600;

        // 그래디언트 배경 (어두운 보라~남색)
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x0f0c29, 0x302b63, 0x24243e, 0x0f0c29, 1);
        bg.fillRect(0, 0, w, h);
        bg.setScrollFactor(0);

        // 타이틀
        this.add.text(w / 2, h / 2 - 80, '유즈 서바이버', {
            fontSize: '52px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#fff',
            stroke: '#ff6b35',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(w / 2, h / 2 - 20, '뱀파이어 서바이버 라이크', {
            fontSize: '18px',
            color: '#b8b8d1'
        }).setOrigin(0.5);

        // 시작 버튼 (박스 + 텍스트)
        const btnW = 200, btnH = 50;
        const btnX = w / 2 - btnW / 2, btnY = h / 2 + 40;
        const btnBg = this.add.graphics();
        btnBg.fillStyle(0x4a4e69, 1);
        btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 8);
        const btnText = this.add.text(w / 2, btnY + btnH / 2, '시작하기', {
            fontSize: '24px',
            color: '#fff'
        }).setOrigin(0.5);

        const btnZone = this.add.zone(w / 2, btnY + btnH / 2, btnW, btnH).setInteractive({ useHandCursor: true });
        btnZone.on('pointerover', () => {
            btnBg.clear();
            btnBg.fillStyle(0x5c5f7a, 1);
            btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 8);
        });
        btnZone.on('pointerout', () => {
            btnBg.clear();
            btnBg.fillStyle(0x4a4e69, 1);
            btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 8);
        });
        btnZone.on('pointerdown', () => {
            this.scene.start('Game');
        });
    }
}

// ========== 게임 플레이 씬 ==========
let player;
let enemies;
let weapons;
let cursors;
let weaponLevel = 1;
let lastFired = 0;

// 스프라이트 크기 (통일)
const SIZES = {
    player: 48,
    enemy: 40,
    weapon: 24
};

class Game extends Phaser.Scene {
    constructor() {
        super({ key: 'Game' });
    }

    preload() {
        this.load.image('main_yuzu', 'main_yuzu.webp');
        this.load.image('enemy_wildyuzu', 'enemy_wildyuzu.webp');
        this.load.image('weapon_gyul', 'weapon_gyul.webp');
        // 효과음 (Mixkit 무료 SFX). 로컬 사용 시 shoot.mp3, kill.mp3 로 교체 가능
        this.load.audio('sfx_shoot', 'https://assets.mixkit.co/active_storage/sfx/2570-shooting-game-bullet-whizzing-by-2570.mp3');
        this.load.audio('sfx_kill', 'https://assets.mixkit.co/active_storage/sfx/2000-explosion-in-a-game-2000.mp3');
    }

    create() {
        const w = 800, h = 600;

        // 그래디언트 배경 (게임용 - 위에서 아래로)
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x0f3460, 1);
        bg.fillRect(0, 0, w, h);
        bg.setScrollFactor(0);

        // 1. 주인공 유즈
        player = this.physics.add.sprite(400, 300, 'main_yuzu');
        player.setCollideWorldBounds(true);
        player.setDisplaySize(SIZES.player, SIZES.player);
        player.setBodySize(SIZES.player, SIZES.player);

        // 2. 적 그룹
        enemies = this.physics.add.group();
        this.time.addEvent({
            delay: 1000,
            callback: () => this.spawnEnemy(),
            callbackScope: this,
            loop: true
        });

        // 3. 무기(귤) 그룹
        weapons = this.physics.add.group({
            defaultKey: 'weapon_gyul',
            maxSize: 30
        });

        cursors = this.input.keyboard.createCursorKeys();
        this.physics.add.overlap(weapons, enemies, (wep, ene) => this.hitEnemy(wep, ene), null, this);
    }

    update(time) {
        player.setVelocity(0);
        if (cursors.left.isDown) player.setVelocityX(-160);
        else if (cursors.right.isDown) player.setVelocityX(160);
        if (cursors.up.isDown) player.setVelocityY(-160);
        else if (cursors.down.isDown) player.setVelocityY(160);

        if (time > lastFired) {
            this.fireGyul(time);
        }

        enemies.getChildren().forEach(enemy => {
            this.physics.moveToObject(enemy, player, 80);
        });
    }

    fireGyul(time) {
        const shootCount = weaponLevel;
        for (let i = 0; i < shootCount; i++) {
            let gyul = weapons.get(player.x, player.y);
            if (gyul) {
                gyul.setActive(true).setVisible(true);
                gyul.setDisplaySize(SIZES.weapon, SIZES.weapon);
                gyul.setBodySize(SIZES.weapon, SIZES.weapon);
                const angle = (i * 0.2) - (shootCount * 0.1);
                this.physics.moveTo(gyul, player.x + 100, player.y + (angle * 100), 300);
                this.time.delayedCall(2000, () => {
                    gyul.setActive(false).setVisible(false);
                });
            }
        }
        lastFired = time + 1000;
        // 발사음
        try { this.sound.play('sfx_shoot', { volume: 0.4 }); } catch (e) {}
    }

    spawnEnemy() {
        const x = Phaser.Math.Between(0, 800);
        const y = Phaser.Math.Between(0, 600);
        const enemy = enemies.create(x, y, 'enemy_wildyuzu');
        enemy.setDisplaySize(SIZES.enemy, SIZES.enemy);
        enemy.setBodySize(SIZES.enemy, SIZES.enemy);
    }

    hitEnemy(weapon, enemy) {
        weapon.setActive(false).setVisible(false);
        enemy.destroy();
        try { this.sound.play('sfx_kill', { volume: 0.35 }); } catch (e) {}
    }
}
