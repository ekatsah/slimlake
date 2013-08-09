int i = 0;

void setup() {
	size(710, 600);
	background(255);
	smooth();
	stroke(50);
	ellipse(50, 50, 25, 25);
}

void draw() {
	ellipse(150 + i * 10, 150 + i * 5, 80, 80);
	if (i > 20) {
		i = 0;
	} else {
		i++;
	}
}
