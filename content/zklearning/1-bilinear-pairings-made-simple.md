---
title: 'Bilinear Pairings Made Simple'
desc: 'A short and clear explanation of bilinear pairings, some use cases and a more in-depth example with Weil pairing.'
order: 1
cat: 'zklearning'
---

# A brief introduction to Bilinear Pairings

Bilinear pairings are a very important concept in cryptography, and they are used in many protocols, such as Zero-Knowledge Proofs and Digital Signatures, among others. In this blog post, we will try to understand what bilinear pairings are, and how they are used in cryptography.

A bilinear pairing can be formally defined as a function $e: \mathbb{G}_1 \times \mathbb{G}_2 \rightarrow \mathbb{G}_T$ where $\mathbb{G}_1$ and $\mathbb{G}_2$ are two additive cyclic groups of prime order q and $\mathbb{G}_T$ is another cyclic group of order q written multiplicatively. We also require $e$ to satisfy the following properties:

- Bilinearity: $e(P, Q + R) = e(P, Q) \cdot e(P, R)$ and $e(P + Q, R) = e(P, R) \cdot e(Q, R)$
- Non-degeneracy: $ e \neq 1$
- Computability: There exists an efficient algorithm to compute e.

We won't care much for the computability property, but the pairing we will be building has several know algorithms that enable its fast computation. 

We could also have it be a symmetrical bilinear pairing if we require $e(P, Q) = e(Q, P)$. Today, we will construct a non-symmetrical bilinear pairing known as the Weil pairing.

But why are pairings useful? Our main goal when constructing a bilinear pairing is to have a group with the discrete logarithm assumption (we assume that given $xG\in \mathbb{G}$, then it is hard to find $x$) but where the decision Diffie Hellman problem is not hard. This problem can be defined as follows:

- **Decision Diffie Hellman**: Given $G, xG, yG$ and $H$ in $\mathbb{G}$, determine whether $H$ is equal to $(xy)G$ or not. We say that the problem is hard if it is hard if for any poly-time adversary $\mathcal{A}$, we have $\mathcal{A}(G, xG, yG, (xy)G) \sim \mathcal{A}(G, xG, yG, R)$ where $R\xleftarrow{R}G$, which is the same as saying that the adversary can't distinguish between the real and the random case in polynomial time.

We can easily see that if we can build  $e: \mathbb{G} \times \mathbb{G} \rightarrow \mathbb{G}_T$, then we could solve this problem by checking if $e(g^x, g^y) = e(g, g)^{xy} = e(g, g^{xy})$ and since we require for it to be computable efficiently, the problem wouldn't be hard.

# Simple use cases of bilinear pairings

Let's see some use cases of bilinear pairings to fully understand their importance in cryptography.

## Digital Signatures

Let's suppose we have a bilinear pairing $e: \mathbb{G} \times \mathbb{G} \rightarrow \mathbb{G}_T$ and a hash function $H: \mathbb{Z} \rightarrow \mathbb{G}$. Consider $G$ to be a generator of the group $\mathbb{G}$. We can use this to construct a digital signature scheme as follows:

- **Key generation**: We will generate the secret key $sk = s \xleftarrow{R} Z $ and the public key $pk = s\cdot G$.
- **Signature**: The signature will be $sig(m) = s\cdot H(m)$. 
- **Verification**: We will verify the signature by checking $e(pk, H(m)) = e(G, sig(m))$. If this is true, then we accept the signature.

We can prove the completeness of this scheme as follows:

$$
e(pk, H(m)) = e(s\cdot G, H(m)) = e(G, H(m))^s = e(G, s \cdot H(m)) = e(G, sig(m))
$$

We can also prove the soundness of this scheme as long as the discrete logarithm problem is hard in the group $\mathbb{G}$ and $\mathbb{G}_T$. Since we make the discrete log assumption we can ensure that $s$ can't be recovered anywhere from $pk$, $sig(m)$ or $e(g, H(m))^s$.

## Zero-Knowledge Proofs

Bilinear pairings in ZKP are an important building block as they allow the construction of efficient polynomial commitment schemes such as KZG, or fast SNARKs such as Groth16. 

We will not go into detail on how they are used in these protocols, but I might cover that in another blog post someday. For now, if interested in learning more about this, I recommend the lectures in the [ZKP MOOC](https://zk-learning.org) organized by Berkeley.

# Weil Pairing

Now that we have some basic understanding of how bilinear pairings work and why they are important, we will show a step-by-step construction of a specific bilinear pairing known as the Weil pairing. Before we strictly define it, we will have to cover some basic math concepts.

Our first goal will be to have a map $e: \mathbb{G} \times \mathbb{G} \rightarrow \mathbb{G}_T$ where we have linearity on the first component, and just by doing so, we will learn a lot of interesting tools that will be useful once we try to build the full bilinear pairing.

## Elliptic Curves

Elliptic curves are a large topic both in mathematics and cryptography, even though it's impossible to cover it all in a blog post, we will try to give a basic introduction to them.

An elliptic curve is a plane curve over the projective field $\mathbb{F}$ defined by the equation $y^2 = f(x)$, where $f(x)$ is a cubic polynomial with no repeated roots. This definition may sound weird; first of all, what is a projective curve? Let's give a concrete example and define what the homogeneous equation is, and this will help us understand the projective space.

Consider the elliptic curve given by the equation $y^2 = x^3 - 1$. Let $x = X/Z$ and $y = Y/Z$, then the equation becomes $(Y/Z)^2 = (X/Z)^3 - 1$ which can be rewritten as $Y^2Z = X^3 - Z^3$. This is the homogeneous (all monomials have the same degree) equation of the curve. Since it is homogeneous we can point out that if $(X, Y, Z)$ is a solution to the equation, then so is $(\lambda X, \lambda Y, \lambda Z)$! We could therefore collapse all solutions $(\lambda X, \lambda Y, \lambda Z)$ to a point $(X, Y, Z)$ and consider this to be the representative of all the points in his line. As a convention, we will always consider the representative to be the one where $Z = 1$, and if $Z = 0$, then we will say that the point is at infinity. 

This is called the projective representation of the curve and we can see that there is always a point at infinity, which is always the point $(0:1:0)$ that we will refer from now on as $O$.

We have now defined what an elliptic curve is, but why is it useful? It turns out that we can define a group operation on top of it. We define it as follows:

- **Group operation**: Given three points in the same line $P$, $Q$ and $R$  we say that $P + Q + R = 0$ holds, therefore we have the group operation $P + Q = -R$. It's important to point out that $P$ and $Q$ can be the same point as long as the line is tangent to the curve on $P$, we call that a point of multiplicity 2.

It can be proven that it is well defined (any line through any two points (or one point with multiplicity 2) in the curve will intersect the curve at a third point) and transitive and therefore the group operation is valid but it's a complex result and will not be covered in this post. 

Here we have an image to get an intuitive grasp of addition on an elliptic curve over the real numbers:

![ECCdrawing](img/zklearning/bilinear_pairings/ECClines.png)

The image shows how addition behaves over the real numbers, nonetheless, curves can be defined over more abstract fields. We will work from now on with elliptic curves defined over finite fields.

## Back to Weil pairing

After this brief elliptic curve introduction we can specify what will groups $G_1$, $G_2$ and $G_T$ be in the case of our first approach where we will have linearity on the first component. Consider $p$ to be a prime number, then we have:

- $\mathbb{G}_1$ and $\mathbb{G}_2$ are both elliptic curves where the points satisfy the equation $y^2 = x^3 + b$ over the field $\mathbb{F}_p$.
- $\mathbb{G}_t$ is the multiplicative group in $\mathbb{F}_{p^{12}}$.

We can now see why we specified $\mathbb{G}_1$ and $\mathbb{G}_2$ as additive groups since the operation in elliptic curves by convention is written as an addition, whereas for the multiplicative group in $\mathbb{F}_{p^{12}}$ we will use the multiplicative notation. 

Even though we have already found where are we going to be working, we still need some more math tools to be able to construct the Weil pairing.

## Some more math concepts: Divisors

A divisor is an alternative way to construct a function by specifying its poles and zeros. Poles are points where the function lies at infinity and zeros are points where the function evaluates to zero. Let's see an example for a better understanding. 

Consider $f(x) = x^2-x+6$, which has two zeros: $-2$ and $3$. If we were given only the zeros, we would be able to reconstruct the function by just having $(x+2)\cdot (x-3)$. The same can be said for rational functions, for example, $f(x) = \frac{x^2-x+6}{x-1}$ has the same zeros and a pole at $1$. We could now find $f(x)$ by multiplying the zeros and dividing by the poles: $f(x) = \frac{(x+2)(x-3)}{x-1}$. 

The notation used for divisors is $D = \sum_{i=0}^n n_i[P_i]$ where $P_i$ are the poles and zeros and $n_i$ their multiplicity (negative if it is a pole and positive if its a zero). In the previous rational function example we would have $(f) = D = 1[-2] + 1[3] - 1[1]$.

The key part of this is that we can also construct functions on the projective plane by defining curves with a similar idea! 

Let's say we have the curve $f(x, y) = x^2-y^2-1 = 0$ whos homogenized version is $f^*(X, Y, Z) = X^2 - Y^2 - Z^2=0$. We can now find the zeros and poles (in the projective curve, poles are points at infinity, which are points with $Z=0$). The zeros are $P = (1, 0, 1)$ and $Q = (-1, 0, 1)$. The poles are $\infty_1 = (1, 1, 0)$ and $\infty_2 = (-1, 1, 0)$. We can now construct the divisor $(f^*) = D = 1[P] + 1[Q] - 1[\infty_1] - 1[\infty_2]$.

To simplify the notation we will consider all infinities to be equal (even though they are not) and we will write $D = P + Q - 2\infty = P + Q - 2O$. And even though this doesn't define a curve, any curve that has this amount of points at infinity will serve our purposes.

Observe that if we have a function $f(x, y)$ that has $(f) = D = \sum_{i=0}^n n_i[P_i]$, then $\bar{f}(x, y) = f(x, y)^k$ has:
$$
\bar{D} = D^k = \sum_{i=0}^n (k\cdot n_i)[P_i]
$$

Since the multiplicities are added when exponentiating the function.

An interesting fact about divisors is that if they define a curve in a projective plane, then the sum of the multiplicities of the poles and zeros is 0. This is called the degree of the divisor and it's denoted as $deg(D)$. It is a consequence of Bezout's theorem.

Another interesting and useful theorem that we will use a lot is the fact that if you "remove" the brackets from the divisors, the points will add to infinity. For example, if we have $D = [P]+[Q]+[-P-Q] - 3[O]$, then we have $P+Q-P-Q-3O = -3O = O$ (All points at infinity are the same). 

The fascinating thing is that if we have a divisor that follows this previous rule, then it is the divisor of a function! This is a consequence of the Riemann-Roch theorem and it's a very important theorem in algebraic geometry. We will use this theorem to make sure that the divisors we use are the divisors of a function we can later reconstruct.

## Back to Weil pairing: Bilinearity on the first component

Recall the groups $\mathbb{G}_1$, $\mathbb{G}_2$ and $\mathbb{G}_T$ from before. Lets say $m$ is the order of $\mathbb{G}_1$, then we define the following functions:

- $(F_P) = m [P] - m [O]$
- $(F_Q) = m [Q] - m [O]$
- $(g) = [P+Q]-[P]-[Q]+[O]$

Here $P$ and $Q$ are general points in $\mathbb{G}_1$. Thanks to the theorem in the previous section, we know that these are the divisors of some functions since group $G_1$ has characteristic $m$ and therefore $nP-nO = O - nO = O$ for any point $P \in \mathbb{G}_1$.

Now lets consider the function $F_P \cdot F_Q \cdot g^m$ which has the following divisor:
$$
(F_P \cdot F_Q \cdot g^m) = (F_P) + (F_Q) + m(g) = \\ = m[P] - m[O] + m[Q] - m[O] + m[P+Q] - m[P] - m[Q] + m[O] = \\ = m[P+Q] - m[O]
$$

Therefore we have a function with $D = m[P+Q] - m[O]$ which looks a lot like the one with $(F_P)$ or $(F_Q)$! We can now say that $(F_{P+Q}) = (F_P \cdot F_Q \cdot g^m)$ and that means the functions are equal despite a constant factor, that we can consider to be $1$ if we pick the functions the right way. Therefore we have: 

$$
F_{P+Q} = F_P \cdot F_Q \cdot g^m
$$

That starts to look a bit linear... but we are not there yet. What we lastly need to get linearity in one coordinate is a procedure named "final exponentiation". 

Consider $z = (p^{12}-1)/m$ where $p^{12}-1$ is the order of the multiplicative group $F_{p^{12}}$, therefore $x^{p^{12}-1} = 1$ $ \forall x \in F_{p^{12}}$. We can see here a requirement for $G_1$ which is to have order $m$ such that $m|p^{12}-1$. If we were to raise to z any element that has been previously raised to $m$, we would get 1. Therefore we can consider

$$
{F_{P+Q}}^z = {F_P}^z \cdot {F_Q}^z \cdot {g^{m}}^z = {F_P}^z \cdot {F_Q}^z
$$

Finally we can construct the pairing $e(P, Q) = {F_P}^z(Q)$, then we would have linearity in the first component since 
$$
e(P+Q, R) = {F_{P+Q}(R)}^z = {F_P(R)}^z \cdot {F_Q(R)}^z = e(P, R) \cdot e(Q, R)
$$

Let's see now how can we fix some things to have bilinearity and be able to claim that we have a bilinear pairing.

## Isogenies

We got to the point where math starts getting a bit trickier. Whenever we have defined a concept, for example, vector spaces or topological spaces, then the next item in the list is to talk about maps between those types of spaces. In this case, we will talk about maps between curves which are called isogenies. 

The formal definition of isogeny is a morphism of algebraic groups. We will not go into the details of what this means, but we will be using it in the context of elliptic curves. For elliptic curves, isogenies are maps from $E_1$ to $E_2$, both of them elliptic curves, such that the point at infinity is mapped to the point at infinity.

The only isogeny we will use throughout this article is the following:

$$
\begin{align*}
  [m] \colon E &\to E \quad m\in \mathbb{Z} \\
  P &\mapsto m\cdot P
\end{align*}
$$

As a corol·lary to the Rieman-Roch theorem, we know that a morphism is either constant or surjective. It can be easily proven that this isogeny is not constant and therefore is surjective.

We can also check that $[m](O) = mO = O$ and therefore sends the point at infinity to the point at infinity.

This isogeny will enable us to define the m-Torsion subgroup of an elliptic curve for $m \in \mathbb{Z}$ as the points that, multiplied by $m$, give the point at infinity. More formally we have the m-Torsion subgroup of $E$ as:

$$
E[m] = \{P \in E \colon [m]P = O\}
$$

Finally, we will give a definition of the function $[m]^*$, which is a particular case of a bigger mathematical concept that will again only need to understand with $[m]$. If we consider $div(E)$ to be the set of divisors from the points of $E$, then this function is defined as follows:

$$
\begin{align*}
  [m]^* \colon div(E) &\to div(E) \\
  [P] &\mapsto \sum_{Q \in [m]^{-1}(P)}[Q]
\end{align*}
$$

Yeah, this is starting to get messy, but this is not a random definition, we are mapping a divisor of a point to the sum of divisors of the points that map to the original point with $[m]$. This will help a lot when defining the Weil pairing. Let's see a concrete example to fully understand the last definitions.

Consider $T \in E[m]$, then we know that $[m](T) = m\cdot T = O$ and therefore $T$ is a point of order $T$. Consider the divisor $m[T]-m[O]$ which is a divisor of a function since $m\cdot T - m\cdot O = O - m \cdot O = O$ and a theorem mentioned in a previous section proves the existence of such function. 

Consider now $T' \in E$ such that $[m]T' = T$. We can ensure this $T'$ exists since we saw before that $m$ is surjective. Then we can consider the divisor $D = [m]^*([T]) - [m]^*([O]) = \sum_{R\in E[m]}[T'+R]-\sum{R \in E[m]}[R]$. Let's study this last equality a bit more thoroughly. 

In the first place, we have to see that $\{Q \in [m]^{-1}(T)\} = \{T'+R\ \colon R \in E[m]\}$ which is true since $[m](T'+R) = [m](T') + [m](R) = T + O = T$. We also know for a fact that if $m$ is a coprime to the order of the field the elliptic curve is working on, then the m-torsion subgroup has $m^2$ elements. Therefore we can check that 

$$
\sum_{R\in E[m]}T'+R-\sum{R \in E[m]}R = \sum_{R\in E[m]}T' = m^2T' = mT = O
$$ 

and we can again ensure that there exists a function $f$ such that $div(f)=D$. This example gave us some intuition on how isogenies and divisors can be used to build functions that fulfill some properties. But the thing is that the example was one of the building blocks of the Weil pairing and will be used next section.

## Finally, back to Weil pairing: Bilinearity on the second component

We finally have all tools needed to finish building this pairing. Let's consider these last two functions, where here m is not the order of the group like it was when we got linearity on the first component, but an integer coprime with the order of the field the elliptic curve is defined on:

- $f$ such that $div(f) = m[P]-m[O]$
- $div(g) = \sum_{R \in E[m]}[P'+R] - \sum_{R \in E[m]}[R]$ where $P'$ is a point such that $[m](P') = P$

This looks a lot like the example we saw in the last section! We can see now that

$$
div(g^m) = m\cdot div(g) = \sum_{R \in E[m]}m[P'+R] - \sum_{R \in E[m]}[R] \\
dig(f([m])) = m \cdot \sum_{R \in E[m]}[P'+R]-[R]
$$

Both functions $g^m$ and $f\circ [m]$ have the same divisor and therefore differ by a constant. Let's consider then $f$ such that the equality holds and we will have:

$$
g^m = f([m])
$$

Now, for any $X \in E$ and $S \in E[m]$, we can see that

$$
g(X+S)^m = f([m](X+S)) = f([m]X+[m]S) = f([m](X)) = g(X)^m \implies \left(\frac{g(X+S)}{g(X)}\right)^m = 1
$$

And therefore we know that $\frac{g(X+S)}{g(X)} \in \mu_m \subseteq F$ where $\mu_m$ are the $m$ roots of unity of $F$. But 

$$
\begin{align*}
    E &\to F \\ 
  X &\mapsto \frac{g(X+S)}{g(X)}
\end{align*}
$$

is a morphism (since E is smooth) which is either constant or surjective, but we proved that the images are roots of unity and $\mu_m \subsetneq F$ which implies that this morphism is constant.

Therefore $\frac{g(X+S)}{g(X)}$ is constant on $X$! 

To achieve linearity on the second component we will have to change a bit the group we worked on in the first part of the blog and we will have to start working on the m-Torsion subgroup of $E$, for $m$ coprime with the order of the prime $p$ of the field the elliptic curve is defined on.

We will finally define the Weil pairing as follows:

$$
\begin{align*}
    e\colon E[m]\times E[m] &\to \mu_m \\ 
    (P, Q) &\mapsto e_m(P, Q) = \frac{g_P(X+Q)}{g_P(X)}
\end{align*}
$$

Remember that $P$ is hidden in the definition of the function $g$ and this is one of the reasons why this pairing es expensive to compute!

Lets now prove linearity on the second coordinate:

$$
e_m(P, Q_1+Q_2) = \frac{g_P(X+S1+S2)}{g_P(X)} = \frac{g_P(X+S1+S2)}{g_P(X+S1)}\cdot \frac{g_P(X+S1)}{g_P(X)} = e_m(P, Q_1)\cdot e_m(P, Q_2)
$$

The last equality uses the fact that $e_m(P, Q_1)$ is constant on $X$ and therefore we can consider $X+S1=X'$ in the first fraction.

Now we may think we have finished, but we still have to prove linearity on the first component! We changed too much stuff from the previous approach and we may have lost this property. Let's see that we have not. 

It can be proven that the Weil pairing can be written in another way as

$$
e_m(P, Q) = (-1)^m\frac{f_P(Q)}{f_Q(P)}
$$

From where we can see that $e_m(P, Q) = e_m(Q, P)^{-1}$ and therefore we have linearity on the first component by the fact that we proved linearity on the second component. The proof of the equivalence of both definitions of the Weil pairing is out of the scope of this blog, but it can be found in [5] in theorem 7.

## Conclusion

We have made it to the end! If you understood everything, congratulations, it took me days to fully get a basic grasp on it and that is what pushed me to write this blog to make the explanation as simple as possible and have it all gathered in one source.

I tried to give some intuition on why we do each thing and why it works, but I may have failed in some parts. If you have any questions or suggestions, please let me know and thanks for reading!

# References

[0] [Lectures about arithmetic on Elliptic Curves by Alvaro Lozano-Robledo](https://www.youtube.com/watch?v=aIB7WAbHyF4&list=PLYpVTXjEi1oe1OeAllJpNhFoI4B7Ws8Yl&index=18)

[1] [Stanford notes on Tate Pairing](https://crypto.stanford.edu/pbc/notes/ep/tate.html)

[2] [Vitalik Buterin's article on Exploring Elliptic Curve Pairings](https://medium.com/@VitalikButerin/exploring-elliptic-curve-pairings-c73c1864e627)

[3] [Stackexchange question about divisors for curves](https://crypto.stackexchange.com/questions/55342/i-cannot-understand-the-concept-of-a-divisor-for-an-elliptic-curve)

[4] [MIT notes on Elliptic curves](https://ocw.mit.edu/courses/18-783-elliptic-curves-spring-2021/pages/syllabus/)

[5] [Bilinear pairings on elliptic curves](https://arxiv.org/pdf/1301.5520.pdf)