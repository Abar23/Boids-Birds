var verts = [-0.5, -0.5, 0.0, 1.0, 0.0, 
    0.5, -0.5, 0.0, 0.0, 0.0,
    0.0,  0.5, 0.0, 0.5, 0.5];

var indices = [0, 1, 2];

class Boid
{
    constructor(shaderProgram) 
    {
        this.mesh = new Mesh(verts, indices, shaderProgram);
        this.acceleration = vec3.create();
        this.velocity = vec3.fromValues(this.RandomValueBetween(-1, 1), this.RandomValueBetween(-1, 1), 0);
        this.position = vec3.create();
        this.maxSpeed = 0.5;
        this.maxSteeringForce = 1;
        this.modelMatrix = mat4.create();
        mat4.identity(this.modelMatrix);
    }

    RandomValueBetween(minimumValue, maximumValue)
    {
        return Math.random() * (maximumValue - minimumValue + 1) + minimumValue;
    }

    Update()
    {
        vec3.add(this.velocity, this.velocity, this.acceleration);
        this.Limit(this.velocity, this.maxSpeed);
        vec3.add(this.position, this.position, this.velocity);
        vec3.set(this.acceleration, 0, 0, 0);
        mat4.translate(this.modelMatrix, this.modelMatrix, this.position);
    }

    Render(shaderProgram)
    {
        // !!!!! FIGURE OUT HEADING / DIRECTION / ANGLE SHIT
        shaderProgram.SetUniformMatrix4fv('mWorld', this.modelMatrix);
        this.mesh.Draw();
    }

    Flock(boids)
    {
        var separation = this.Separate(boids);
        var alignment = this.Align(boids);
        var cohesion = this.Cohesion(boids);
        // Weight forces here
        vec3.add(this.acceleration, this.acceleration, separation);
        vec3.add(this.acceleration, this.acceleration, alignment);
        vec3.add(this.acceleration, this.acceleration, cohesion);
    }

    Borders()
    {

    }

    Run(boids, shaderProgram)
    {
        this.Flock(boids);
        this.Update();
        this.Borders();
        this.Render(shaderProgram);
    }

    Separate(boids) 
    {
        var desiredSeparation = 4;
        var steerVector = vec3.create();
        var count = 0;

        for (var i = 0; i < boids.length; i++)
        {
            var dist = vec3.distance(this.position, boids[i].position);
            if (dist > 0 && dist < desiredSeparation)
            {
                var distanceVector = vec3.fromValues(dist, dist, dist);
                var diff = vec3.create();
                vec3.subtract(diff, this.position, boids[i].position);
                vec3.normalize(diff, diff);
                vec3.divide(diff, diff, distanceVector);
                vec3.add(steerVector, steerVector, diff);
                count++;
            }
        }

        if (count > 0)
        {
            var countVector = vec3.create();
            vec3.set(countVector, count, count, count);
            vec3.divide(steerVector, steerVector, countVector);
        }

        if (vec3.length(steerVector) > 0)
        {
            var maxSpeedVector = vec3.fromValues(this.maxSpeed, this.maxSpeed, this.maxSpeed);
            vec3.normalize(steerVector, steerVector);
            vec3.multiply(steerVector, steerVector, maxSpeedVector);
            vec3.subtract(steerVector, steerVector, this.velocity);
            this.Limit(steerVector, this.maxSteeringForce);
        }

        return steerVector;
    }

    Align(boids)
    {
        var neighborDistance = 4;
        var sumVector = vec3.create();
        var count = 0;

        for (var i = 0; i < boids.length; i++) 
        {
            var dist = vec3.distance(this.position, boids[i].position);
            if (dist > 0 && dist < neighborDistance)
            {
                vec3.add(sumVector, sumVector, boids[i].velocity);
                count++;
            }
        }

        var steerVector = vec3.create();
        if (count > 0)
        {
            var maxSpeedVector = vec3.fromValues(this.maxSpeed, this.maxSpeed, this.maxSpeed);
            var countVector = vec3.create();
            vec3.set(countVector, count, count, count);
            vec3.divide(sumVector, sumVector, countVector);
            vec3.normalize(sumVector, sumVector);
            vec3.multiply(sumVector, sumVector, maxSpeedVector);
            vec3.subtract(steerVector, sumVector, this.velocity);
            this.Limit(steerVector, this.maxSteeringForce);
        }

        return steerVector;
    }

    Cohesion(boids) 
    {        
        var neighborDistance = 4;
        var sumVector = vec3.create();
        var count = 0;

        for (var i = 0; i < boids.length; i++) 
        {
            var dist = vec3.distance(this.position, boids[i].position);
            if (dist > 0 && dist < neighborDistance)
            {
                vec3.add(sumVector, sumVector, boids[i].position);
                count++;
            }
        }

        var steerVector = vec3.create();
        if (count > 0)
        {
            var maxSpeedVector = vec3.fromValues(this.maxSpeed, this.maxSpeed, this.maxSpeed);
            var countVector = vec3.create();
            vec3.set(countVector, count, count, count);
            vec3.divide(sumVector, sumVector, countVector);

            var desired = vec3.create();
            vec3.subtract(desired, sumVector, this.position);
            vec3.normalize(desired, desired);
            vec3.multiply(desired, desired, maxSpeedVector);

            vec3.subtract(steerVector, desired, this.velocity);
            this.Limit(steerVector, this.maxSteeringForce);
        }

        return steerVector;
    }

    Limit(vector, max)
    {
        if (vec3.length(vector) > max)
        {
            var scaleRatio = this.maxSpeed / vec3.length(this.velocity);
            vec3.scale(vector, vector, scaleRatio);
        }
    }

}
