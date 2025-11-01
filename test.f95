program basics
  implicit none
  integer :: a=5, b=7

  print *, "sum =", add(a,b)
  print *, "factorial(5) =", fact(5)
  call swap(a,b)
  print *, "after swap:", a, b

contains
  integer function add(x,y)
    integer, intent(in) :: x,y
    add = x + y
  end function

  recursive integer function fact(n)
    integer, intent(in) :: n
    if (n <= 1) then
       fact = 1
    else
       fact = n * fact(n-1)
    end if
  end function

  subroutine swap(x,y)
    integer, intent(inout) :: x,y, t
    t = x; x = y; y = t
  end subroutine
end program