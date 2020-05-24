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
  debug: boolean;

  constructor(scene: Phaser.Scene, boid: Boid) {
    super(scene);
    this.scene.add.existing(this);

    this.boid = boid;
    this.draw();
  }

  drawCircleSegment(angle: number, radius: number): void {
    this.beginPath();
    this.arc(0, 0, radius, -angle / 2, angle / 2);
    this.lineTo(0, 0);
    this.fillPath();
  }
  draw() {
    if (this.debug) {
      this.fillStyle(0xa0ffaf);
      this.drawCircleSegment(Boid.sightAngle, Boid.sightRadius);
      this.fillStyle(0xffafaf);
      this.drawCircleSegment(Boid.sightAngle, Boid.repelRadius);
    }

    this.fillStyle(0x00ffff);
    this.lineStyle(1, 0x000000);
    this.fillTriangle(10, 0, -10, -7, -10, +7);
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

    // Uncomment for debugging.
    //this.boidViews[0].debug = true;
    //this.boidViews[0].draw();

    this.cameras.main.setBackgroundColor("0xFFFFFF");
  }
}

const game = new Main();
