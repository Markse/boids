import { Boid } from "./boid";

class Main extends Phaser.Game {
  constructor() {
    super({
      type: Phaser.AUTO,
      scene: BoidScene,
      width: 800,
      height: 600,
      canvas: document.getElementById("canvas") as HTMLCanvasElement,
    });
  }
}

// tslint:disable-next-line: max-classes-per-file
class BoidView extends Phaser.GameObjects.Graphics {
  boid: Boid;

  constructor(scene: Phaser.Scene, boid: Boid) {
    super(scene);
    this.scene.add.existing(this);

    this.boid = boid;
    this.fillStyle(0x00ffff);
    this.fillTriangle(10, 0, -10, -7, -10, +7);
    this.lineStyle(1, 0x000000);
    this.strokeTriangle(10, 0, -10, -7, -10, +7);
  }

  update(delta: number) {
    this.setPosition(this.boid.x, this.boid.y);
    this.setRotation(this.boid.angle);
  }
}

// tslint:disable-next-line: max-classes-per-file
class BoidScene extends Phaser.Scene {
  boidViews: BoidView[];
  boids: Boid[];

  update(time: number, delta: number) {
    this.boids.forEach((boid) => {
      boid.update(delta, this.boids);
    });

    this.boidViews.forEach((view) => {
      view.update(delta);
    });
  }

  create() {
    this.boids = [];
    this.boidViews = [];
    for (let i = 0; i < 50; i++) {
      const boid = new Boid();
      this.boids.push(boid);
      this.boidViews.push(new BoidView(this, boid));
    }
  }
}

const game = new Main();
