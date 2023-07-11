---
title: "KZG Polynomial Commitment, the Building Block of Zero Knowledge Proofs"
desc: "Quick explanation of KZG polynomial commitment, which I will later use in another blog to build the first zk-SNARK, PLONK."
order: 4
cat: 'zklearning'
---

# Introduction

What if I told you that two polynomials are equal if they evaluate to the same value at a random point? Then I would be lying, but I might not be that far from the truth as we will see later on! Today we will discover how this fact helps us build a polynomial commitment, but we will first have to understand what a polynomial commitment is and why would we want to build it.

This blog won't cover the basics of ZKP as they are not needed for the constructions, nonetheless, they might be useful to understand the utility of polynomial commitments. If you are not familiar with ZKP, I recommend you read [2] first.

I'm currently writing this blog post since it's gonna be the foundation of my work at Berkeley throughout the next months along with the Plonk[3] algorithm, whose blog I will try to publish tomorrow. Writing things out and trying to explain them makes me understand them much more and I hope it helps you too!

# Commitment Schemes

To understand polynomial commitments we should first understand what a commitment scheme is. Let's understand this with an example.

Imagine you and your friend are playing a game and the winner will be decided by a coin toss, nonetheless, you are not together, but chatting on Discord. What if the one who tosses the coin lies about the coin outcome so he wins? The other won't have any way to verify the outcome. This is where commitment schemes come in handy. A commitment scheme is a cryptographic primitive that allows you to commit to a value without revealing it. In our example, you could commit to the coin toss outcome before he chooses head or tails. Once you commit he will choose, and then you will uncommit the value and reveal it. This way he can verify that you didn't lie about the outcome.

For this to be valid we need for the committer to not be able to uncommit to a value different than the value committed. That means that he should not be able to prove that he had committed to tails if he had committed to heads.

We will do this the following way:
- The committer tosses the coin, let's say it's heads. He then chooses a random value $r$ and computes the commitment $C = H(heads, r)$, where $H$ is a collision-resistant hash function.
- He then sends C to the verifier. He will now choose heads or tails. Let's say he chooses heads.
- The committer will now send $heads, r$ to the verifier. He will then check that $C = H(heads, r)$. If this is true, then the outcome is valid.

In this example, the committer lost, so let's say he wanted to cheat and prove that he had committed to tails. He would have to find a value $r'$ such that $C = H(tails, r')$. This is not possible as $H$ is collision-resistant!

This is a very simple example of a commitment scheme, but a very useful one, since we can also commit to bitstrings, not only bits. This helps us build digital signatures as well as verifiable secret-sharing schemes.

We saw an example of a commitment scheme that enables us to commit to bitstrings, but what if we want to commit to polynomials? What does it even mean to commit to a polynomial?

# Polynomial Commitments

When we commit to a polynomial we don't want to hide the polynomial to later reveal it when uncommitting, as one may have expected from what the previous committing scheme did. Instead of that, we will commit to commit to a polynomial and the verifier will be able to request evaluations of the polynomial at any point and we will be able to provide them along with proof that the evaluation is correct, without revealing anything else about the polynomial.

A polynomial commitment scheme consists of four algorithms:
- **Setup($1^\lambda, d$)**: Generates the appropriate algebraic structure as well as a $$(pk, sk)$$ pair.
- **Commit($pk, \phi(x)$)**: Outputs a commitment $C$ to a polynomial $\phi(x)$ using $pk$.
- **CreateWitness($pk, \phi(x), y$)**: Ouputs $\langle i, \phi(i), w_i \rangle$, where $w_i$ is the witness for the evaluation of $\phi(x)$ at $i$.
- **VerifyEval($pk, C, i, \phi(i), w_i$)**: Outputs 1 if $w_i$ is a valid witness for the evaluation of $\phi(x)$ at $i$ and 0 otherwise.

The uses of these commitment schemes are not as straightforward as the previously presented one, but it helps us a lot to build ZKP schemes and we will use it later on to build the first zk-SNARK, PLONK. So with that in mind, let's present the KZG scheme, one of many polynomial commitment schemes, and the one used in the PLONK original paper.

# KZG Polynomial Commitment

The KZG polynomial commitment scheme is the one proposed by Kate, Zaverucha and Goldberg in [1]. It is a very simple scheme that uses a bilinear map to commit to a polynomial. 

The main idea of the scheme relies on the fact that if $\phi(x)$ is a polynomial and $\phi(y) = c$, then $\phi(x) - c = \Phi_y(x)(x-y)$ since it has a root at point y. Therefore, if we prove that this equality holds, we will be proving that $\phi(x)$ has a root at $y$, and therefore that $\phi(y) = c$. This is when the statement I started the blog with comes in handy.

I said that if two polynomials evaluate to the same value at a random point, then they are equal. This is not true, but what are the odds of having two different polynomials, evaluating them at a random point and then getting the same result? Well, let's first suppose we have a polynomial of at most degree $t$. If we were to get a random value $r$ from $\mathbb{F}_p$ and evaluate $f(r)$, the odds of us getting 0 are at most $\frac{t}{p}$, in which case if we ensure that $p \gg t$, then it's negligible, and therefore we can assume that the polynomial is $f(x) = 0$ WHP (with high probability). Now if we had two polynomials, we can just subtract them and prove that the result is 0, and therefore that they are equal. That is why the following statement is true:

> If $f(x)$ and $g(x)$ are two polynomials of degree at most $t$ and $f(r) = g(r)$ for a random $r \in \mathbb{F}_p$, then $f(x) = g(x)$ WHP.

Now that we know this, we can use it to prove that $\phi(x) - c = \Phi_y(x)(x-y)$ just by evaluating it at a random point, which in our case is gonna be the secret key $\alpha$.

Let's see the four algorithms that make up this scheme:

- **Setup($1^\lambda, d$)**: This algorithm takes as input the security parameter $1^lambda$ and a polynomial degree limit $d$. He then generates two groups $G$ and $G_t$ along with a bilinear map $e: G \times G \rightarrow G_t$ and a generator $g \in G$. He then generates a public key $pk$ and a secret key $sk$. The $sk$ is a random $\alpha \in \mathbb{Z}_p$, where $p$ is a prime value. The $pk$ are the values $\langle g, g^\alpha, g^{\alpha^2}, ..., g^{\alpha^d}\rangle$ along with $G, G_t$ and $e$.
- **Commit($pk, \phi(x)$)**: This algorithm takes as input the public key $pk$ and a polynomial $\phi(x)$. It then computes the commitment $C = g^{\phi(\alpha)}$. Since we don't have $sk$ and therefore we don't have $\alpha$, the only way to compute this value is with $\prod_{i=0}^d (g^{\alpha^i})^{\phi_i} = \prod_{i=0}^d g^{\phi_i \alpha^i} = g^{\sum_{i=0}^d \phi_i \alpha^i} = g^{\phi(\alpha)}$, where $\phi_i$ is the coefficient of the $x^i$ term of $\phi(x)$.
- **CreateWitness($pk, \phi(x), y$)**: This algorithm takes as input the public key $pk$, a polynomial $\phi(x)$ and a point $y$. It then computes $\Phi_y(x) = \frac{\phi(x)-phi(y)}{(x-y)}$ and the witness $w_y = g^{\Phi_y(\alpha)}$ which can be computed the same way as the commitment. Then the output will be $\langle y, \phi(y), w_y \rangle$.
- **VerifyEval($pk, C, y, \phi(y), w_y$)**: This algorithm takes as input the public key $pk$, a commitment $C$, a point $y$, the evaluation of the polynomial at that point $\phi(y)$ and the witness $w_y$. It then computes checks if $e(g^{\Phi_y(\alpha)}, g^{\alpha-y}) = e(g, g^{\phi(\alpha) - \phi(y)})$. If this is true, then the output is 1, otherwise, it is 0. See that all the values can be computed by just having the public key, and without the need for the secret key by using the product of powers trick.

First of all, why is this verification enough to prove that $\phi(\alpha) - c = \Phi_y(\alpha)(\alpha-y)$?

> $e(g^{\Phi_y(\alpha)}, g^{\alpha-y}) = e(g, g)^{\Phi_y(\alpha)(\alpha-y)} = e(g, g)^{\phi(\alpha) - \phi(y)} = e(g, g^{\phi(\alpha) - \phi(y)})$

This is true if and only if $\phi(\alpha) - c = \Phi_y(\alpha)(\alpha-y)$, and therefore we have proved that $\phi(y) = c$.

If you don't know much about bilinear pairings, you can check my other blog post that provides a construction of the Weil pairing. Nonetheless, the only thing you need to know is that the bilinear map is a map that takes two elements from a group and outputs an element from another group and that it has the following properties:
- Bilinearity: $e(P, Q + R) = e(P, Q) \cdot e(P, R)$ and $e(P + Q, R) = e(P, R) \cdot e(Q, R)$
- Non-degeneracy: $ e \neq 1$
- Computability: There exists an efficient algorithm to compute e.

# Trying to break the scheme
To ensure a scheme is safe, we always need to think of ways to break it. How could we break this scheme? By providing a witness $\langle y, c', w_y \rangle$ that passes the verification even though $\phi(y) \neq c'$. To do that we will need to ensure that $\phi(\alpha) - c' = \Phi_y(\alpha)(\alpha-y)$. Since all of these are values and we are in a field (we can divide) we could just compute $\Phi_y(\alpha) = \frac{\phi(\alpha) - c'}{\alpha-y}$. The problem we face is that we don't actually have $\alpha$, and therefore can't explicitly compute $\phi(\alpha)$ nor $\Phi_y(\alpha)$.

What do we try then? We will see if we can obtain $g^{\Phi_y(\alpha)}$, which would be the commitment. We have $g^{\phi(\alpha)}$, $g^{c'}$, $g^{\alpha}$ and $g^{y}$. And we need $g^{\frac{\phi(\alpha) - c'}{\alpha-y}}$. Since we can't divide in the exponents of $g$, finding this is impossible. That is why we can't create a false witness that passes the verification. This property is the evaluation-binding property and can be proven by reducing the problem to the t-SDH problem and is pretty advanced.

Another way to break this would be to break the hiding property. That means that we should try to find the polynomial $\phi(x)$ from the commitment $C = g^{\phi(\alpha)}$. This is also an advanced proof, but it's much shorter so I'll include it here. If you are not interested, you can skip this part.

Suppose there exists an adversary $\mathcal{A}$ that can break the hiding property given $t$ valid witness tuples $\langle y, \phi(y), w_y \rangle$. Let's show we can build an algorithm $\mathcal{B}$ that breaks the DL assumption by using $\mathcal{A}$.

Let $\langle g, g^a \rangle$ be the DL instance that $\mathcal{B}$ needs to solve. $\mathcal{B}$ then generates $t$ random pairs $\langle j, \phi(j) \rangle$ and using those $t$ pairs and the pair $\langle 0, a \rangle$ assumes that $\phi(x)$ is the interpolation of those points. He knows all of them but the evaluation at 0, which is $a$. He then uses the KZG public key along with $g^a$ to compute the witness $w_j$ for the t chosen evaluations $\langle j, \phi(j) \rangle$, $w_j = g^{\frac{\phi(\alpha)-\phi(j)}{\alpha-j}}$. He then sends the $t$ witness tuples to $\mathcal{A}$ and he then outputs the polynomial $\phi(x)$, which he can compute since we assumed that he can break the hiding property. Using this polynomial we then evaluate it at point 0 and we find $a$, therefore breaking the DL assumption!

This is a pretty cool proof of the hiding property of the scheme and can be found, along with the proof of the evaluation-binding property in [1], the extended version of the KZG paper.

# Interesting properties

An interesting property of this commitment is that it's homomorphic, which means that if we had two witness tuples $\langle y, \phi_1(y), w_{y,1} \rangle$ and $\langle y, \phi_2(y), w_{y,2} \rangle$, then we can produce the tuple $\langle y, \phi_1(y) + \phi_2(y), w_{y,1} \cdot w_{y,2} \rangle$ which is a valid witness for the polynomial $\phi_1(x) + \phi_2(x)$. That enables us to improve the hiding property, which is only valid for polynomial running time adversaries to an unconditional hiding property, which means that the hiding property holds for any adversary, even if he has infinite computational power. This is pretty cool, as it's the same as saying that when providing a witness we are only giving the information about the evaluation, and nothing more, in terms of information theory.

This is done by adding a random polynomial to our polynomial and providing proof for the sum. You can find the full procedure in [0] along with its proofs in [1].

Another interesting property is the fact that we can batch multiple evaluation proofs into one single group element, enabling us to prove multiple evaluations at once. 

This is done by modifying the witness generation to have $\Phi_B(x) = \frac{\phi(x)-r(x)}{\prod_{y\in B} (x-y)}$ where $B$ is the set of points we want to prove and $r(x)$ is the remainder of the polynomial division of $\frac{\phi(x)}{\prod_{y \in B}(x-y)}$, therefore we have that $\phi(x) - r(x) = \Phi_B(x)\prod_{y \in B}(x-y)$ and for $i \in B$ we have $\phi(i) = r(i)$. We can think of this as the same we did before, instead of having $\phi(y)$ we have a polynomial $r(x)$ that interpolates the points $\langle y, \phi(y) \rangle$. Now, the witness creation outputs $\langle B, r(x), w_B \rangle$ where $w_B$ is the same as before, $w_B = g^{\Phi_B(\alpha)}$.

Now we can change the verification algorithm to work with batch witnesses the following way: we will have to check if $e(g^{\phi(\alpha)-r(\alpha)}, g) = e(g^{\Phi_B(\alpha)}, g^{\prod_{y \in B}(\alpha - y)})$. The reason this works is left as an exercise to the reader and is done the same way it was done in the non-batch case.

Finally mention one minor interesting properties which is the fact that both the witness and the commitment are constant in size, which is pretty cool!

# Conclusion

We have seen how to create a polynomial commitment scheme that is constant in size and has a constant size witness. We have also seen how to prove that the scheme is hiding and an informal proof of the evaluation-binding property! 

I feel like this may be a hard-to-read blog because its applications aren't trivial, nonetheless, you will find it much more interesting once we present the applications in the next blog post! 



# References

[0] [Constant-Size Commitments to Polynomials and Their Applications](https://www.iacr.org/archive/asiacrypt2010/6477178/6477178.pdf)

[1] [Polynomial Commitments](https://cacr.uwaterloo.ca/techreports/2010/cacr2010-10.pdf)

[2] [Zero Knowledge Proofs: An illustrated primer](https://blog.cryptographyengineering.com/2014/11/27/zero-knowledge-proofs-illustrated-primer/)

[3] [PlonK: Permutations over Lagrange-bases for Oecumenical Noninteractive arguments of Knowledge](https://eprint.iacr.org/2019/953.pdf)