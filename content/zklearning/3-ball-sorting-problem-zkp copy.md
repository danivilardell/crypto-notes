---
title: "Ball sorting game with ZKP"
desc: "A ZKP physical protocol to prove knowledge of the solution to a ball sorting puzzle in t steps using playing cards."
order: 3
cat: 'zklearning'
---

# Ball sorting puzzle game

The ball sorting puzzle is a game that has been played a lot lately on smartphones and may sound familiar. It consists of several tubes with colored balls in them (that we can think of as stacks), and the main goal is to have all the balls of the same color in the same tube. The only allowed operation is to move the top ball from one tube to another. 

![ball_game](img/zklearning/ball_puzzle_zkp/ball_game.png)

Even though this version of the puzzle is the standard one, it has not been proven if finding a solution in $t$ steps is NP-complete. However, there is a variant of the puzzle that has been proven to be NP-complete, and it is the one we will use in this post. This variant adds a new constraint: the top ball of a tube can only be moved to a tube that is either empty or has a ball of the same color on top.

Having a protocol for the first version would also be useful, nonetheless, it is always more interesting to have protocols for NP statements. 

Since the problem is NP-complete, there exists a polynomial time reduction to the 3-coloring problem, which has a simple ZKP protocol[1]. This means that we could build a ZKP proof by solving the reduced 3-coloring problem, nonetheless, this would be a bit boring and the reduction is not always trivial or short. Instead, we will build a ZKP protocol for the ball sorting puzzle directly and by using cards, so it can be executed just with a simple card deck.

# Idea of the protocol

It is clear that if we show that we do each step correctly without showing each specific step, and when we finish after $t$ steps all colored balls are in the correct tube, then the prover has proven to the verifier that he knows a solution to the puzzle in $t$ steps. Here a step is to move a ball from one tube to another, and therefore we have to proof the following:
- The prover is moving a ball from the top of a tube to the top of another tube that is not full.
- The prover is moving a ball to a tube that is either empty or has a ball of the same color on top.

We will design three protocols, one for each proof.

# Prelimineries

We will be using playing cards to work on the protocol, so it will be possible to simulate it at home without any computer power.

We will first define $E_q(x)$ as the stack of $q$ cards that are:

- if $1 \leq x \leq q$ then all cards are 0 but card number $x$ on the stack that is 1.
- if $x = 0$ then all cards are 0.
- if $x = q+1$ then all cards are 1.

For example $E_4(2)$ would be the stack of 4 cards that are $\fbox{0}\fbox{1}\fbox{0}\fbox{0}$, $E_4(0)$ would be the stack of 4 cards that are $\fbox{0}\fbox{0}\fbox{0}\fbox{0}$ and $E_4(5)$ would be the stack of 4 cards that are $\fbox{1}\fbox{1}\fbox{1}\fbox{1}$.

Consider that we have $n$ filled tubes (and therefore $n$ different colors (we will imagine colors as values from 1 to n)), each tube is of height $h$ and we also have $m$ empty tubes that we can use to move balls around. Throughout the protocol, we will imagine the empty spaces as balls with a value of 0. We will also add a ball with the value 0 on top of the tube and a ball with the value $n+1$ at the bottom of the tube. This will help simplify the protocol.

![center_60](img/zklearning/ball_puzzle_zkp/balls_display.png)

How do we represent this using playing cards? For each ball in this new representation of the problem, we will have the stack $E_{n}(x)$, where $x$ is the value of the ball. We will therefore have a matrix of stacks of cards of size $n \times (h+2)$. They will all be upside down so that the verifier can't see any value of this matrix of stacks. For the previous example we would have the following matrix:

![center_30](img/zklearning/ball_puzzle_zkp/matrix_balls.png)

We are all set to start with the first proof.

## Protocol 1: Prover is moving a ball from the top of a tube to the top of another tube

This is the same as showing that we are swapping a ball $b_i$ with a value different than 0 or $n+1$ that has a ball $a_{i-1}$ with 0 on top of it with a ball $b_j$ with a value 0 that has a ball $b_{j+1}$ with a value different than 0 below it. 

When thinking with stacks of cards, we will have to prove that we are swapping a stack of cards $a_i$ that is not $E_{n}(0)$ or $E_{n}(n+1)$, that has a stack of cards $a_{i-1} = E_{n}(0)$ on top of it with a stack of cards $b_j = E_{n}(0)$ that has a stack of cards $b_{j+1} \neq E_{n}(0)$ below it. Here we have $i$ and $j$ values from 1 to $n$.

It would be trivial as a prover to show the verifier the four stacks mentioned above and for the verifier to check if they are valid. Nonetheless, this wouldn't be zero knowledge. This is why we have to think a bit more about how to work the protocol.

The intuition behind the idea is to shuffle the columns of the matrix and then show the verifier the two stacks from the columns we are swapping. This way the verifier can't know which columns the stacks we are swapping belong to. Nonetheless, the verifier will still know the height of the two values we want to show, and therefore if we were to just show the stacks we want to swap, he would still have some information. This is why we now shuffle each of the two stacks we have to show, but this time we maintain the cyclic order, which means we will just shift all the stacks in the column by a random number of positions. This way the verifier will not know the height of the stacks we are showing him.

Now we show the verifier the stacks $a_x$ and $b_y$, which are the same as $a_i$ and $b_j$ but in the new permutation. The verifier will check if $a_x$ is not $E_{n}(0)$ or $E_{n}(n+1)$ and that $b_y$ is $E_{n}(0)$. We will also show that $a_{x-1}$ is $E_{n}(0)$ and $b_{y+1}$ is not $E_{n}(0)$ ($x+1$ and $y+1$ are modulus $n$). This way the verifier will know that we are swapping the stacks $a_x$ and $b_y$.

We have now proven that we are swapping two stacks, one of them with a ball value and one of them with the empty value, the first one having no ball on top and the second one having a ball or a $n+1$ value on the bottom.

To prove that we are not moving a ball to a full stack, we will check if the value on top of the empty value we are swapping is in fact, another empty value. This means we have to check if $b_{y-1}$ is $E_{n}(0)$. If it is not, that would imply that $b_{y-1}$ is $E_{n}(n+1)$, which would mean that the stack $b_y$ is full. This would mean that we are moving a ball to a full stack, which is not allowed.

We can now move on to the second proof.

## Protocol 2: Prover is moving a ball to a tube that is either empty or has a ball of the same color on top

This would be the same as showing that the stack right below the $0$ value stack we are swapping is either the same stack as the one we swap, or the stack with all 1(the bottom stack). If we consider $a_{x}$ to be $E{n}(k)$ (the stack for a ball of value $k$), then it would be enough to check that the card in position $k$ from both stacks $a_{x}$ and $b{y+1}$ is a 1. That would imply that either the stack $b_{y+1}$ is the same as $a_{x}$ or that it is the stack with all 1. 

This may sound correct but we are leaking information about what color is the ball we swap on the ith step. The solution to that will be to use a protocol called the Color Checking Protocol.

### Color Checking Protocol

This protocol enables us to check the following: Given two sequences $E_q(x_1)$ and $E_q(x_2)$ ($0 \leq x_1, x_2 \leq q+1) and

- $1 \leq x_1 \leq q$
- either $x_1 = x_2$ or $x_2 = q+1$
  
without revealing any other information.

The protocol is as follows:

- Construct the following $3 \times q$ matrix $M$:
  - In Row 1 place the sequence $E_q(x_1)$
  - In Row 2 place the sequence $E_q(x_2)$
  - In Row 3 place the sequence $E_q(1)$
- Shuffle the columns of M such that the cyclic order is maintained.
- Show that in Row 1 there is only one card with value 1 by showing all cards. Suppose the 1 is in position $i$. This proves that $1 \leq x_1 \leq q$.
- Reveal the card in position $i$ in Row 2. If it is a 1, then either $x_1 = x_2$ or $x_2 = q+1$.
- Shuffle again the columns of M such that the cyclic order is maintained.
- Finally reveal the third row and use it to revert $M$ to its original form.

This may sound complicated but it is clear intuitively that this proves the required claims and maintains zero knowledge. The idea of having a third row to keep track of the shuffling and be able to revert it to the original form is interesting and is used in the different proofs when we have to shuffle the stacks. We won't go into detail with the other shuffling protocols since they are similar to this one, and I thought this one was the most interesting to deeply explain.

Now that we have this Color Checking protocol we can use it to prove that the prover is moving a ball to a tube that has a ball of the same color on top (case $x = y$) or is empty (case $y = n+1$).

This ends the protocol as we have now proven that the prover is moving a ball to a tube that is either empty or has a ball of the same color on top.

To show the whole zero-knowledge proof we would have to prove the validity of each step by using the last two protocols, and finally reveal the stacks to show that they are in the correct ending position.

# Conclusions

This blog post shows a cool physical zero-knowledge proof presented in [0], but I mainly wrote it since it contains some ideas that can be extrapolated easily to other physical protocols, such as the shuffling techniques used to maintain zero knowledge and how to revert it to the original state. 

This is also my first zero-knowledge blog post and I thought that a physical protocol would be a great way to get a grasp on how zero-knowledge is obtained and how can it be used in simple tasks. Nonetheless, the zero-knowledge used in cryptography is built on top of a more complicated structure that enables us to generate proofs for any general circuit. I will write some blog posts later in the future about what circuits are and how can we generate proofs for them, but since there is a lot of information online about it, I will try to find an interesting way to present it. 

I hope you enjoyed it and learned something new! 

# References

[0] [Physical Zero-Knowledge Proof for Ball Sort Puzzle](https://arxiv.org/pdf/2302.07251.pdf)

[1] [Zero-Knowledge Proof for 3-colorable graph](https://www.cs.cmu.edu/~goyal/s18/15503/scribe_notes/lecture23.pdf)
