import { Boid } from "../src/boid";

function toRad(degree: number): number {
  return (degree * Math.PI) / 180;
}
describe("Boid", () => {
  let boid: Boid;

  beforeEach(() => {
    // Reset default values
    Boid.sightRadius = 70;
    Boid.sightAngle = Math.PI;
    Boid.repelRadius = 30;
    Boid.maxSpeed = 0.2;
    Boid.minSpeed = 0.05;

    Boid.areaWidth = 800;
    Boid.areaHeight = 600;

    Boid.centerWeight = 0.0005;
    Boid.alignmentWeight = 0.05;
    Boid.separationWeight = 0.1;

    // Generic test boid
    boid = new Boid(10, 20);
  });

  test("can be created", () => {
    expect(boid).toBeDefined();
  });

  test("saves given location", () => {
    expect(boid.x).toBe(10);
    expect(boid.y).toBe(20);
  });

  test("moves in a direction", () => {
    boid.angle = toRad(45);
    boid.speed = 1;
    Boid.maxSpeed = 10;
    boid.update(1, []);

    expect(boid.x).toBe(10 + 1 / Math.sqrt(2));
    expect(boid.y).toBe(20 + 1 / Math.sqrt(2));
  });

  test("wraps around the borders", () => {
    Boid.areaWidth = 500;
    Boid.areaHeight = 600;
    boid.x = 450;
    boid.y = 550;
    boid.update(0, []);

    expect(boid.x).toBe(450);
    expect(boid.y).toBe(550);

    Boid.areaWidth = 400;
    Boid.areaHeight = 500;

    boid.update(0, []);

    expect(boid.x).toBe(50);
    expect(boid.y).toBe(50);

    boid.x = -10;
    boid.y = -20;

    boid.update(0, []);

    expect(boid.x).toBe(390);
    expect(boid.y).toBe(480);
  });

  test("limits speed to MaxSpeed", () => {
    Boid.maxSpeed = Infinity;
    boid.speed = 100;
    boid.update(0, []);

    expect(boid.speed).toBe(100);

    Boid.maxSpeed = 5;
    boid.update(0, []);
    expect(boid.speed).toBe(5);
  });

  test("limits speed to MinSpeed", () => {
    Boid.minSpeed = 0;
    boid.speed = 0;
    boid.update(0, []);

    expect(boid.speed).toBe(0);

    Boid.minSpeed = 1;
    boid.update(0, []);

    expect(boid.speed).toBe(1);
  });
  describe("neighbor functions", () => {
    let b1: Boid;
    let b2: Boid;
    let b3: Boid;

    beforeEach(() => {
      b1 = new Boid(10, 29);
      b2 = new Boid(10, 31);
      b3 = new Boid(16, 13);
    });

    test("sees boids its neighborhood", () => {
      Boid.sightAngle = 2 * Math.PI;
      Boid.sightRadius = 10;

      const visibleBoids = boid.getVisibleBoids([b1, b2, b3]);
      expect(visibleBoids.length).toBe(2);
      expect(visibleBoids).toContain(b1);
      expect(visibleBoids).toContain(b3);
    });

    test("sees only within a given angle", () => {
      Boid.sightAngle = Math.PI / 2;
      Boid.sightRadius = 10;
      boid.angle = Math.PI / 2;
      boid.speed = 1;

      const bIn1 = new Boid(14.9, 25.1);
      const bOut1 = new Boid(15.1, 24.9);

      const bIn2 = new Boid(5.1, 25.1);
      const bOut2 = new Boid(4.9, 24.9);

      const visibleBoids = boid.getVisibleBoids([b1, bIn1, bIn2, bOut1, bOut2]);

      expect(visibleBoids).toContain(b1);
      expect(visibleBoids).toContain(bIn1);
      expect(visibleBoids).toContain(bIn2);
      expect(visibleBoids).not.toContain(bOut1);
      expect(visibleBoids).not.toContain(bOut2);
      expect(visibleBoids.length).toBe(3);
    });

    test.skip("sees beyond the borders of the area", () => {
      Boid.sightRadius = 10;
      Boid.areaHeight = 100;
      Boid.areaWidth = 200;
      const b4 = new Boid(1, 1);
      boid.x = 199;
      boid.y = 99;

      expect(boid.getVisibleBoids([b4])).toEqual([b4]);
      expect(b4.getVisibleBoids([boid])).toEqual([boid]);
    });
    test.todo("steers to points beyond the borders of the area");

    test("does not see itself", () => {
      expect(boid.getVisibleBoids([boid])).toEqual([]);
    });

    test("finds the direction to center of its neighbors", () => {
      expect(boid.findCenter([b1, b3])).toEqual({ x: 3, y: 1 });
    });

    test("steers towards behaviors", () => {
      boid.findCenter = jest.fn((x) => ({ x: 1, y: 1 }));
      boid.avoidBoids = jest.fn((x) => ({ x: 2, y: 2 }));
      boid.alignAngles = jest.fn((x) => ({ x: 3, y: 3 }));
      Boid.sightRadius = 100;
      Boid.centerWeight = 1;
      Boid.separationWeight = 2;
      Boid.alignmentWeight = 3;

      const mockSteerTo = jest.fn();
      boid.steerTo = mockSteerTo;

      boid.update(0, []);
      expect(boid.steerTo).toBeCalledTimes(0);

      boid.update(0, [b1, b2, b3]);
      expect(boid.steerTo).toBeCalledTimes(3);
      expect(mockSteerTo).toHaveBeenCalledWith({ x: 1, y: 1 }, 1);
      expect(mockSteerTo).toHaveBeenCalledWith({ x: 2, y: 2 }, 2);
      expect(mockSteerTo).toHaveBeenCalledWith({ x: 3, y: 3 }, 3);
    });

    test("steers towards coordinates", () => {
      boid.angle = toRad(90);
      boid.speed = 1;

      boid.steerTo({ x: 3, y: 1 }, 1);

      const expectedAngle = Math.atan2(2, 3);
      const expectedSpeed = Math.sqrt(3 * 3 + 2 * 2);

      expect(boid.angle).toBe(expectedAngle);
      expect(boid.speed).toBe(expectedSpeed);
    });

    test("aligns to the avarage angle of neighbors", () => {
      b1.angle = toRad(45);
      b3.angle = toRad(90);

      const v = {
        x: boid.speed * Math.cos(toRad(67.5)),
        y: boid.speed * Math.sin(toRad(67.5)),
      };
      expect(boid.alignAngles([b1, b3])).toEqual(v);
    });

    test("keeps distance from neighbors", () => {
      const d1 = Math.sqrt(9 * 9);
      const d2 = Math.sqrt(6 * 6 + 7 * 7);

      Boid.repelRadius = 0;
      expect(boid.avoidBoids([b1, b3])).toEqual({ x: 0, y: 0 });

      Boid.repelRadius = 9;
      expect(boid.avoidBoids([b1, b3])).toEqual({ x: 0 / d1, y: -9 / d1 });

      Boid.repelRadius = 10;
      expect(boid.avoidBoids([b1, b3])).toEqual({
        x: (0 / d1 + -6 / d2) / 2,
        y: (-9 / d1 + 7 / d2) / 2,
      });
    });
  });
});
