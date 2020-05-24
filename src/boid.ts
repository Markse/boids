interface Vector {
  x: number;
  y: number;
}

const Vector = {
  magnitude(v: Vector): number {
    return Math.sqrt(Math.pow(v.x, 2) + Math.pow(v.y, 2));
  },

  angle(v: Vector): number {
    return Math.atan2(v.y, v.x);
  },

  distance(v1: Vector, v2: Vector): number {
    return Math.sqrt(Math.pow(v1.x - v2.x, 2) + Math.pow(v1.y - v2.y, 2));
  },

  fromPolar(magnitude: number, angle: number): Vector {
    return {
      x: magnitude * Math.cos(angle),
      y: magnitude * Math.sin(angle),
    };
  },
};

/**
 * Returns the distance between two points on a wrapped axis
 *
 * @param {number} p1 First point
 * @param {number} p2 Second point
 * @param {number} axisLenght Lenght of the axis
 * @returns {number}
 */
function wrappedDistance(p1: number, p2: number, axisLenght: number): number {
  let diff = p1 - p2;

  if (diff > axisLenght / 2) {
    diff -= axisLenght;
  } else if (diff < -axisLenght / 2) {
    diff += axisLenght;
  }

  return Math.abs(diff);
}

function closestWrappedPoint(
  from: number,
  to: number,
  axisLenght: number
): number {
  const diff = from - to;

  if (diff > axisLenght / 2) {
    return to + axisLenght;
  } else if (diff < -axisLenght / 2) {
    return to - axisLenght;
  } else {
    return to;
  }
}

export class Boid {
  static sightRadius: number = 70;
  static sightAngle: number = Math.PI * (5 / 4);
  static repelRadius: number = 30;
  static maxSpeed: number = 0.2;
  static minSpeed: number = 0.05;

  static areaWidth = 800;
  static areaHeight = 600;

  static centerWeight: number = 0.001;
  static alignmentWeight: number = 0.005;
  static separationWeight: number = 0.03;

  x: number;
  y: number;

  angle: number;
  speed: number;

  constructor(x?: number, y?: number) {
    this.x = x || Math.random() * Boid.areaWidth;
    this.y = y || Math.random() * Boid.areaHeight;
    this.angle = Math.random() * Math.PI * 2;
    this.speed = Boid.maxSpeed;
  }

  update(time: number, boids: Boid[]): void {
    const visibleBoids = this.getVisibleBoids(boids);

    if (visibleBoids.length > 0) {
      this.steerTo(this.findCenter(visibleBoids), Boid.centerWeight);
      this.steerTo(this.avoidBoids(visibleBoids), Boid.separationWeight);
      this.steerTo(this.alignAngles(visibleBoids), Boid.alignmentWeight);
    }

    this.speed = Math.min(this.speed, Boid.maxSpeed);
    this.speed = Math.max(this.speed, Boid.minSpeed);

    const direction = this.getDirection();
    this.x += time * direction.x;
    this.y += time * direction.y;

    if (this.x < 0) {
      this.x += Boid.areaWidth;
    }
    if (this.y < 0) {
      this.y += Boid.areaHeight;
    }
    this.x = this.x % Boid.areaWidth;
    this.y = this.y % Boid.areaHeight;
  }

  getDirection(): Vector {
    return Vector.fromPolar(this.speed, this.angle);
  }

  /**
   * Steers the boid to a coordinate relative to its
   * current position by altering speed and angle
   *
   * @param v Position vector relative to boid position (i.e. boid position is (0,0)).
   * @param weight Number to determine how much influence the steering has.
   */
  steerTo(v: Vector, weight: number) {
    const direction = this.getDirection();
    direction.x += weight * v.x;
    direction.y += weight * v.y;

    this.speed = Vector.magnitude(direction);
    this.angle = Vector.angle(direction);
  }

  inAngle(b: Boid, angleLimit: number): boolean {
    const relativePosition = {
      x: closestWrappedPoint(this.x, b.x, Boid.areaWidth) - this.x,
      y: closestWrappedPoint(this.y, b.y, Boid.areaHeight) - this.y,
    };
    const relativeAngle = Vector.angle(relativePosition);

    const diff = wrappedDistance(this.angle, relativeAngle, Math.PI * 2);

    return b !== this && diff <= angleLimit / 2;
  }

  distanceTo(b: Boid): number {
    const v = {
      x: wrappedDistance(this.x, b.x, Boid.areaWidth),
      y: wrappedDistance(this.y, b.y, Boid.areaHeight),
    };

    return Vector.magnitude(v);
  }

  inRadius(b: Boid, r: number): boolean {
    return b !== this && this.distanceTo(b) <= r;
  }

  getVisibleBoids(boids: Boid[]): Boid[] {
    return boids.filter(
      (b) =>
        this.inRadius(b, Boid.sightRadius) && this.inAngle(b, Boid.sightAngle)
    );
  }

  findCenter(boids: Boid[]): Vector {
    const center = { x: 0, y: 0 };

    boids.forEach((b) => {
      center.x += closestWrappedPoint(this.x, b.x, Boid.areaWidth);
      center.y += closestWrappedPoint(this.y, b.y, Boid.areaHeight);
    });

    center.x = center.x / boids.length - this.x;
    center.y = center.y / boids.length - this.y;

    return center;
  }

  alignAngles(boids: Boid[]): Vector {
    let avarage = 0;

    boids.forEach((b) => (avarage += b.angle));

    const angle = avarage / boids.length;
    return Vector.fromPolar(this.speed, angle);
  }

  avoidBoids(boids: Boid[]): Vector {
    const closeBoids = boids.filter((b) => this.inRadius(b, Boid.repelRadius));
    const direction = { x: 0, y: 0 };

    if (closeBoids.length > 0) {
      closeBoids.forEach((b) => {
        const dist = this.distanceTo(b);

        const x = closestWrappedPoint(this.x, b.x, Boid.areaWidth);
        const y = closestWrappedPoint(this.y, b.y, Boid.areaHeight);
        direction.x += (this.x - x) / dist;
        direction.y += (this.y - y) / dist;
      });

      direction.x = direction.x / closeBoids.length;
      direction.y = direction.y / closeBoids.length;
    }

    return direction;
  }
}
