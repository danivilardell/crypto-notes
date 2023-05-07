---
title: "Yao's Millionaire's discrete problem"
desc: "Simple alternative solution to Yao's Millionaire's problem discrete finite version I came up with while learning about oblivious transfer protocols"
order: 2
cat: 'zklearning'
---

# Yao's Millionaire's problem
Yao's Millionaire's problem is a secure multi-party computation problem first introduced by Andrew Yao back in 1982 that tries to solve the following problem: Alice and Bob want to compare their salaries to see who is earning the most, nonetheless, they don't want to reveal anything about their salaries but the one bit of information that says if it's lower or higher than the other salary. 

This can be simplified by saying that we want a protocol that lets us check if $a \geq b$ without revealing $a$ nor $b$. 

We can consider three versions of the problem:
- Continuous version: The values compared lay in $\mathbb{R}$.
- Discrete version: The values compared lay in $\mathbb{N}$.
- Finite version: The values compared lay in a finite set of $\mathbb{N}$.

It's clear that if we solved the continuous one then we would have the other two solved, but the [solution to the continuous case](https://en.wikipedia.org/wiki/Yao%27s_Millionaires%27_problem) is very complex and it would be interesting to see if we could provide a simpler solution for the other case. The solution I will provide will be for the finite version but in practical terms, this is enough as all salaries usually range within a finite amount of values (for example from zero to one trillion \$).

# Use case of this protocol

A use case of this protocol is to solve a problem many people face every day. When applying for jobs, you may have a minimum salary requirement that you would want the company to provide, and there is also a maximum salary the company is willing to pay you. If the minimum salary was higher than the maximum offered by the company, then it wouldn't make sense to go through the application process at all! 

If you as a job applicant were to reveal this value and it was much lower than what the company was willing to pay, they could reduce the salary they would have offered you otherwise. As well as if the company reveals the maximum salary they are willing to pay, the applicant could increase its expectancies and claim more when offered the real salary if it was lower than the maximum they said they could offer.

By using the problem we solve this problem as the company and the applicant can check beforehand if the salary expectation is lower than the maximum salary offered in this position and if not, not go through the selection process.

# First solution to the problem

I will provide a simple solution that I read the first time this problem was proposed to me in the finite case version and we will see that it is not fully correct.

Since we are working on the finite case we have $n$ possible values of salary. The protocol will work as follows:

- Alice enters the room and gets $n$ boxes labeled with each possible salary value. She then puts inside the box a piece of paper with "Yes" written if the box's salary is lower than hers and "No" otherwise. Alice then leaves the room.
- Bob now enters the room and checks the paper inside the box with his salary value and checks whether the written value is "Yes" or "No". If the value is "Yes" he knows that his salary is lower than Alice's and if it's "No" he knows that his salary is higher than Alice's. Bob then leaves the room and tells Alice the result.

This simple solution to the problem may seem correct, but it doesn't take into account that, without the use of a third party it's impossible to know if Bob opened one, two or all the boxes in the room. 

A solution for this problem could be to have the boxes be commitments and commit to bit $0$ if "No" and $1$ if "Yes". Then to open a box, Bob would have to request Alice for the key to open the commitment. This wouldn't work because Bob would have to reveal to Alice which box he wants to open and Alice could then deduce Bob's salary.

We will propose a solution using a technique used in Oblivious transfer protocols that solves this problem.

# Solution to the problem
Taking into account that the finite set is of size n, let $m_1, ..., m_n$ be $1$ or $0$ depending on whether the i'th box has a "Yes" or a "No". The protocol to solve this problem will be the following:
- Alice generates RSA key pair ($N, e, d$) and sends the public portion ($N, e$) to Bob. 
- Alice generates n random values $x_1, ..., x_n$ in $\mathbb{Z}_N$ and sends them to Bob.
- Bob generates a random value $k$ in $\mathbb{Z}_N$ and a random value $b$ in $\mathbb{Z}_n$ and sends $v = (x_b + k^e) \mod N$ to Alice.
- Alice computes $k_i = (v - x_i)^d \mod N$ for $i = 1, ..., n$. There will be only one $k_i$ equal to $k$ but Alice doesn't know which one since $k$ is a random value. Alice then sends $m_i' = m_i + k_i$ to Bob.
- Bob will finally compute $m_b = m_b' - k$ and will know the value of the box.

We can see that this protocol is correct because if $b = i$ then $k_i = k$ and $m_b = m_i'-k = m_i+k_i-k = m_i$; and if $b \neq i$ then $m_b = m_i'-k = m_i+k_i-k \neq m_i$ and since $k_i$ is a random value, Bob won't be able to get any information about $m_i$.

# References

[0] [The Simplest Protocol for Oblivious Transfer](https://eprint.iacr.org/2017/370.pdf)

[1] [Yao's Millionaires' problem and decoy-based public key encryption by classical physics](https://eprint.iacr.org/2014/384.pdf)

[2] [Oblivious transfer lecture from Berkeley CS 276 - Cryptography course](https://people.eecs.berkeley.edu/~sanjamg/classes/cs276-fall14/scribe/lec15.pdf)
