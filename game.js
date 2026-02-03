// 게임 설정
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let player;
let enemies;
let weapons;
let cursors;
let weaponLevel = 1; // 귤 레벨 (1~3)
let lastFired = 0;

function preload() {
    // 유저가 지정한 파일명 적용
    this.load.image('main_yuzu', 'main_yuzu.webp');
    this.load.image('enemy_wildyuzu', 'enemy_wildyuzu.webp');
    this.load.image('weapon_gyul', 'weapon_gyul.webp');
}

function create() {
    // 1. 주인공 유즈 생성
    player = this.physics.add.sprite(400, 300, 'main_yuzu');
    player.setCollideWorldBounds(true);

    // 2. 적 그룹 생성
    enemies = this.physics.add.group();

    // 일정 시간마다 괴즈 생성
    this.time.addEvent({
        delay: 1000,
        callback: spawnEnemy,
        callbackScope: this,
        loop: true
    });

    // 3. 무기(귤) 그룹 생성
    weapons = this.physics.add.group({
        defaultKey: 'weapon_gyul',
        maxSize: 30
    });

    // 4. 입력 설정
    cursors = this.input.keyboard.createCursorKeys();

    // 5. 충돌 설정 (무기와 적)
    this.physics.add.overlap(weapons, enemies, hitEnemy, null, this);
}

function update(time) {
    // 플레이어 이동 로직
    player.setVelocity(0);
    if (cursors.left.isDown) player.setVelocityX(-160);
    else if (cursors.right.isDown) player.setVelocityX(160);
    if (cursors.up.isDown) player.setVelocityY(-160);
    else if (cursors.down.isDown) player.setVelocityY(160);

    // 자동 공격 시스템 (귤 던지기) - scene 컨텍스트(this) 전달
    if (time > lastFired) {
        fireGyul.call(this, time);
    }

    // 모든 적들이 플레이어를 추적하게 함
    enemies.getChildren().forEach(enemy => {
        this.physics.moveToObject(enemy, player, 80);
    });
}

// 귤 발사 로직 (레벨에 따라 투사체 증가)
function fireGyul(time) {
    const shootCount = weaponLevel; // 레벨 1=1개, 2=2개, 3=3개

    for (let i = 0; i < shootCount; i++) {
        let gyul = weapons.get(player.x, player.y);
        if (gyul) {
            gyul.setActive(true).setVisible(true);
            // 레벨에 따라 약간 다른 각도로 발사되도록 설정
            const angle = (i * 0.2) - (shootCount * 0.1);
            this.physics.moveTo(gyul, player.x + 100, player.y + (angle * 100), 300);

            // 화면 밖으로 나가면 제거 (객체 풀링)
            this.time.delayedCall(2000, () => { gyul.setActive(false).setVisible(false); });
        }
    }
    lastFired = time + 1000; // 1초마다 발사
}

function spawnEnemy() {
    // 화면 밖 랜덤한 위치에서 괴즈 등장 (키: preload와 동일하게 'enemy_wildyuzu')
    const x = Phaser.Math.Between(0, 800);
    const y = Phaser.Math.Between(0, 600);
    const enemy = enemies.create(x, y, 'enemy_wildyuzu');
}

function hitEnemy(weapon, enemy) {
    weapon.setActive(false).setVisible(false);
    enemy.destroy(); // 나중에 체력 시스템 도입 가능
}
