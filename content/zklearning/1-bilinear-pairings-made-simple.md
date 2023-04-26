---
title: 'Bilinear Pairings Made Simple'
desc: 'A simple explanation of bilinear pairings, some use cases and a more in depth example with Tate pairing.'
order: 1
cat: 'zklearning'
---

# A brief introduction to Bilinear Pairings

Bilinear pairings are a very important concept in cryptography, and they are used in many protocols, such as Zero-Knowledge Proofs, Digital Signatures, and others. In this blog post, we will try to understand what bilinear pairings are, and how they are used in cryptography.

A bilinear pairing can be formally defined as a function $e : G_1 \times G_2 \rightarrow G_T$ where $G_1$ and $G_2$ are two additive cyclic groups of prime order q and $G_T$ is another cyclic group of order q written multiplicative. We also require $e$ to satisfy the following properties:

- Bilinearity: $e(P, Q + R) = e(P, Q) \cdot e(P, R)$ and $e(P + Q, R) = e(P, R) \cdot e(Q, R)$
- Non-degeneracy: $ e \neq 1$
- Computablility: There exists an efficient algorithm to compute e.

We could also have it be a symmetrical bilinear pairing if we require $e(P, Q) = e(Q, P)$. In this blog post we will construct a symmetrical bilinear pairing known as the Tate pairing.

Our main goal when constructing a bilinear pairing is to have a group with the discrete logarithm assumption but where the decision Diffie Hellman problem is not hard. This problem can be defined as follows:

- **Decision Diffie Hellman**: Given $G, xG, yG$ and $H$, determine whether $H = (xy)G$. We say that the problem is hard if it is hard if for any poly-time adversary $\mathcal{A}$, $\mathcal{A}(G, xG, yG, (xy)G) \sim \mathcal{A}(G, xG, yG, R)$ where $R\xleftarrow{R}G$, which is the same as saying that the adversary can't distinguish between the real and the random case in polynomial time.

If we had a bilinear pairing we could then solve this problem by checking if $e(g^x, g^y) = e(g, g)^{xy} = e(g, g^{xy})$.

# Why are bilinear pairings important?

Let's see some use cases of bilinear pairings to fully understand their importance in cryptography.

## Digital Signatures

Let's suppose we have a bilinear pairing $e : G \times G \rightarrow G_T$ and a hash function $H : \mathbb{Z} \rightarrow G$. Consider $g$ to be a generator of group G. We can use this to construct a digital signature scheme as follows:

- **Key generation**: We will generate the secret key $sk = s \xleftarrow{R} Z $ and the public key $pk = g^s$.
- **Signature**: The signature will be $sig(m) = H(m)^s$. 
- **Verification**: We will verify the signature by checking $e(pk, H(m)) = e(g, sig(m))$. If this is true, then we accept the signature.

We can prove the completness of this scheme as follows:

$$
e(pk, H(m)) = e(g^s, H(m)) = e(g, H(m))^s = e(g, H(m)^s) = e(g, sig(m))
$$

We can also prove soundness of this scheme as long as the discrete logarithm problem is hard in the group $G$ and $G_T$. Since we make the discrete log assumption we can ensure that $s$ can't be recovered anywhere from $pk$, $sig(m)$ or $e(g, H(m))^s$.

## Zero-Knowledge Proofs

Some of the most used SNARKs(Succinct Non-Interactive Arguments of Knowledge) use bilinear pairings in order to work. We will not go into detail about how SNARKs work, but we will show how we can use bilinear pairings to construct a simple polynomial commitment scheme known as KZG. 

... FINISH LATER

# Tate Pairing

Now that we have some basic understanding of how bilinear pairings work and why they are important, we will show a step by step construction of a specific bilinear pairing known as the Tate pairing. Before we strictly define it, we will have to cover some basic math concepts.

## Elliptic Curves

Elliptic curves are a large topic both in mathematics and cryptography, even though it's impossible to cover it all in a blog post, we will try to give a basic introduction to them.

An elliptic curve is as a plane curve over the projective field $\mathbb{F}$ defined by the equation $y^2 = f(x)$, where $f(x)$ is a cubic polynomial with no repeated roots. This definition may sound weird; first of all, what is a projective curve? Let's give a concrete example and define what the homogeneous equation is.

Consider the elliptic curve given by the equation $y^2 = x^3 - 1$. Let $x = X/Z$ and $y = Y/Z$, then the equation becomes $(Y/Z)^2 = (X/Z)^3 - 1$ which can be rewritten as $Y^2Z = X^3 - Z^3$. This is the homogeneous (all monomials have the same degree) equation of the curve. Since it is homogeneous we can point out that if $(X, Y, Z)$ is a solution to the equation, then so is $(\lambda X, \lambda Y, \lambda Z)$ as long as $\lambda \neq 0$. We could therefore collapse all solutions $(\lambda X, \lambda Y, \lambda Z)$ to a point $(X, Y, Z)$ and consider this to be the representative of all the points. 

This is called the projective representation of the curve and it provides one additional point at infinity! If we where to treat the curve at $\mathbb{F}^2$, then we would have all points of the form $(x, y)$ that solve the equation, which in the projective representation would be $(x, y, 1)$. Now we have all this points and an all the points at infinity of the form $(x, y, 0)$, nonetheless it can be proven that for all elliptic curves, there is a unique single point at infinity that solves the equation, which in the example before would be $(0, 1, 0)$. We will treat this single point at infinity as $O$ from now on.

We have now defined what an elliptic curve is, but why is it usefull? It turns out that we can define a group operation on top of it. We define the group operation as follows:

- **Group operation**: Given three points in the same line $P$, $Q$ and $R$  we say that $P + Q + R = 0$ holds, therefore we have the group operation $P + Q = -R$. It's important to point out that $P$ and $Q$ can be the same point as long as the line is tangent to the curve on $P$, we call that a point of multiplicity 2.

It can be proven that any line through any two points (or one point with multiplicity 2) in the curve will intersect the curve at a third point and also the transitivity of the operation and therefore the group operation is valid but it's a complex result and will not be covered in this post. 

To get an intuitive grasp of addition we can look at the following image:

![test](img/zklearning/ECClines.png)
<img src="img/zklearning/ECClines.png" alt="drawing"/>

The image shows how does addition behave if the curve where to be defined over the real numbers. Nonetheless, curves can be defined over more abstract fields. We will work from now on with elliptic curves defined over finite fields.

## Back to Tate pairing

After this brief elliptic curve introduction we can specify what will groups $G_1$, $G_2$ and $G_T$ be in the case of the Tate pairing.
- $G_1$ is an elliptic curve where the points satisfy the equation $y^2 = x^3 + b$ over the field $\mathbb{F}_p$.
- $G_2$ is an elliptic curve where the points satisfy the same equation as in $G_1$ but defined over the field $\mathbb{F}_{p^{12}}$.
- $G_t$ is the multiplicative group in $\mathbb{F}_{p^{12}}$.

We can now see why we specified $G_1$ and $G_2$ as additive groups, since the operation in elliptic curves by convention is written as an addition, whereas for the multiplicative group in $\mathbb{F}_{p^{12}}$ we will use the multiplicative notation. 

Even though we have already found where are we going to be working on, we still need some more math tools to be able to construct the Tate pairing.

## Some more math concepts: Divisors

A divisor is an alternative way to construct a function by specifying it's poles and zeros. Poles are points where the function lays at infinity and zeros are points where the function evaluates to zero. Let's see an example for a better understanding. 

Consider $f(x) = x^2-x+6$, which has two zeros: $-2$ and $3$. If we where given only the zeros, we would be able to reconstruct the function. The same can be said for rational functions, for example $f(x) = \frac{x^2-x+6}{x-1}$ has the same zeros and a pole at $1$. We could now find $f(x)$ by multiplying the zeros and dividing by the poles: $f(x) = \frac{(x+2)(x-3)}{x-1}$. 

The nontation used for divisors is $D = \sum_{i=0}^n n_i[P_i]$ where $P_i$ are the poles and zeros and $n_i$ their multiplicity (negative if its a pole and positive if its a zero). In the previous rational function example we would have $(f) = D = 1[-2] + 1[3] - 1[1]$.

The key part of this is that we can also construct functions on the projective plane by defining curves with a similar idea! Let's say we have the curve $f(x, y) = x^2-y^2-1 = 0$ whos homogenized version is $f^*(X, Y, Z) = X^2 - Y^2 - Z^2=0$. We can now find the zeros and poles (in the projective curve, poles are points at infinity, which are points with $Z=0$). The zeros are $P = (1, 0, 1)$ and $Q = (-1, 0, 1)$. The poles are $\infty_1 = (1, 1, 0)$ and $\infty_2 = (-1, 1, 0)$. We can now construct the divisor $(f^*) = D = 1[P] + 1[Q] - 1[\infty_1] - 1[\infty_2]$.

To simplify the nontation we will consider all infinities to be equal(even though they are not) and we will write $D = P + Q - 2\infty = P + Q - 2O$. And even though this doesn't define a curve, any curve that has this amount of points at infinity will serve for our purposes.

Observe that if we have a function $f(x, y)$ that has $(f) = D = \sum_{i=0}^n n_i[P_i]$, then $f^*(x, y) = f(x, y)^k$ has:
$$
D^* = D^k = \sum_{i=0}^n (k\cdot n_i)[P_i]
$$

An interesting fact about divisors is that if they define a curve in a projective plane, then the sum of the multiplicities of the poles and zeros is 0. This is called the degree of the divisor and it's denoted as $deg(D)$. It is a consequence of Bezout's theorem.

Another interesting and useful theorem that we will use is the fact that if you "remove" the brakets from the divisors, the points will add to infinity. For example, if we have $D = [P]+[Q]+[-P-Q] - 3[O], then we have $P+Q-P-Q-3O = -3O = O$(All points at infinity are the same). The fascinating thing is that if we have a divisor that follows this rule, then it is the divisor of a function. This is called the Riemann-Roch theorem and it's a very important theorem in algebraic geometry. We will use this theorem to make sure that the divisors we use are the divisors of a function we can later reconstruct.

## Back to Tate pairing, bilinearity on the first component

Recall the groups $G_1$, $G_2$ and $G_T$ from before. Lets say $n$ is the order of $G_1$, then we define the following functions:

- $(F_P) = n [P] - n [O]$
- $(F_Q) = n [Q] - n [O]$
- $(g) = [P+Q]-[P]-[Q]+[O]$

Here $P$ and $Q$ are general points in $G_1$. Thanks to the theorem on the previous section, we know that these are the divisors of some functions since group $G_1$ has characteristic $n$ and therefore $nP-nO = O$ for any point $P \in G_1$.

Now lets consider the function $F_P \cdot F_Q \cdot g^n$ which has the following divisor:
$$
(F_P \cdot F_Q \cdot g^n) = (F_P) + (F_Q) + n(g) = \\ = n[P] - n[O] + n[Q] - n[O] + n[P+Q] - n[P] - n[Q] + n[O] = \\ = n[P+Q] - n[O]
$$

Therefore we have a function with $D = n[P+Q] - n[O]$ which looks a lot like the one with $(F_P)$ or $(F_Q)$! We can now say that $(F_{P+Q}) = (F_P \cdot F_Q \cdot g^n)$ and therefore we have 

$$
F_{P+Q} = F_P \cdot F_Q \cdot g^n
$$

That start to look like a pairing... but we are not there yet.

What we lastly need to get bilinearity in one coordinate (we will later have to work on how to get it with the second one) is a procedure named "final exponentiation". Consider $z = (p^{12}-1)/n$ where $p^{12}-1$ is the order of the multiplicative group $F_{p^{12}}$, therefore $x^{p^{12}-1} = 1$ $ \forall x \in F_{p^{12}}$. We can see here a requirement for $G_1$ which is to have order $n$ such that $n|p^{12}-1$. If we where to raise to z any element that has been previously rasen to n, we would get 1. Therefore we can consider

$$
{F_{P+Q}}^z = {F_P}^z \cdot {F_Q}^z \cdot {g^{n}}^z = {F_P}^z \cdot {F_Q}^z
$$

We can see here some bilinearity and if we considered the pairing $e(P, Q) = {F_P}^z(Q)$, then we would have bilinearity in the first component since 
$$
e(P+Q, R) = {F_{P+Q}(R)}^z = {F_P(R)}^z \cdot {F_Q(R)}^z = e(P, R) \cdot e(Q, R)
$$

Lets see now how can we fix some things in order to have bilineality on the second component and be able to claim that we have a bilinear pairing.

## Isogenies

We got to the point where math starts getting a bit trickier. Whenever we have defined a concept, for example vector spaces or topological spaces, then next item in the list is to talk about maps between those types of spaces. In this case we will talk about maps between curves which are called isogenies. 

## Bilinearity on the second component

# References


[1] [Stanford notes on Tate Pairing](https://crypto.stanford.edu/pbc/notes/ep/tate.html)

[2] [Vitalik Buterin's article on Exploring Elliptic Curve Pairings](https://medium.com/@VitalikButerin/exploring-elliptic-curve-pairings-c73c1864e627)

[3] [Stackexchange question about divisors for curves](https://crypto.stackexchange.com/questions/55342/i-cannot-understand-the-concept-of-a-divisor-for-an-elliptic-curve)

[4] [MIT notes on Elliptic curves](https://ocw.mit.edu/courses/18-783-elliptic-curves-spring-2021/pages/syllabus/)