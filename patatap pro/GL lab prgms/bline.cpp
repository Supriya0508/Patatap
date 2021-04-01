//bline.cpp : Bresenham Line algorithm, works only for |m| < 1

#include <GL/glut.h>
#include <stdio.h>
#include <math.h>

void init(void)
{
  glClearColor(1.0,1.0,1.0,0.0);
  glMatrixMode(GL_PROJECTION);
  gluOrtho2D(0.0,400.0,0.0,400.0);
}

void setPixel(GLint x,GLint y)
{
  glBegin(GL_POINTS);
     glVertex2i(x,y);
  glEnd();
}

void line()
{
  int x0 = 50, y0=50, xn = 300, yn = 150, x, y;
  int	dx, dy,		//deltas
	pk,		//decision parameter
  	k;		//looping variable

  glClear(GL_COLOR_BUFFER_BIT);
  glColor3f( 1 ,0, 0);
  setPixel(x0, y0);	//plot first point

  // difference between starting and ending points
  dx = xn - x0;
  dy = yn - y0;
  pk = 2 * dy - dx;
  x = x0;	y = y0;

  for ( k = 0; k < dx-1; ++k ) {
    if ( pk < 0 ) {
      pk = pk + 2 * dy;			//calculate next pk
					//next pixel: (x+1, y )
    } else {
      					//next pixel: (x+1, y+1)
      pk = pk + 2*dy - 2*dx;		//calculate next pk
      ++y;
    }
    ++x;
    setPixel( x, y );
  }

  glFlush();
}

int main(int argc,char **argv){
    glutInit(&argc,argv);
    glutInitDisplayMode(GLUT_SINGLE|GLUT_RGB);
    glutInitWindowPosition(0,0);
    glutInitWindowSize(500,500);
    glutCreateWindow("Bresenham Line");
    init();
    glutDisplayFunc( line );
    glutMainLoop();
    return 0;
}
