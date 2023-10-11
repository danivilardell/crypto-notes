---
title: "PIANIST: Plonk vIA uNlimited dISTribution"
desc: "We now know that Plonk is a good IOP, but could we do better? In this post we will see how to scale Plonk by unlimited distribution."
order: 4
cat: 'zklearning'
---

# Introduction

In the previous post, we saw how to construct a zkSNARK using the Plonk protocol and the KZG polynomial commitment. Even though the whole prover side of the protocol runs in time $O(n \log(n))$, with $n$ being the size of the circuit, it can still be too slow in some particular cases. Among them, the main ones are zkRollups and zkEVM, the first one being a scaling solution for blockchains by batching multiple transactions together and succinctly proving their correctness with a SNARK, and the second one is a virtual machine that executes smart contracts in a way that is compatible with zero-knowledge-proof computation. The complexity of both systems can bring up circuits of $2^{30}$ or bigger, which is too slow for the current Plonk implementation which can only scale up to $2^{25}$.

In this post, we will explain how this challenge can be tackled by making multiple machines compute the PLONK proof at once. But first I'll introduce some concepts about SNARKs that I didn't cover in the previous blog since it was already complicated enough. When I talked about PLONK, I provided the construction given in the original paper, and even though there are now constructions that make it easier to understand, it was useful since this same construction was the one used in the PIANIST paper.

**Pianist: Scalable zkRollups via Fully Distributed Zero-Knowledge Proofs** is the latest work of Tianyi Liu, Tiancheng Xie, Jiaheng Zhang, Dawn Song and Yupeng Zhang and was published the same day this post was written.

# SNARKs

We have seen a polynomial commitment scheme (KZG), and we have also seen an interactive oracle proof (PLONK), if we combine both of them we get a SNARK! But what is a SNARK? A SNARK is a succinct non-interactive argument of knowledge, which means a short way to prove, non-interactively, the knowledge of a witness for a statement. 

The IOP (interactive oracle proof) provides the general structure of the protocol, and the polynomial commitment scheme is a tool used in most of the IOPs. Nonetheless, the fact that we can separate them means that we could have the PLONK protocol use any other polynomial commitment scheme, and we could also use the KZG scheme in other IOPs. That is beneficial since each IOP and polynomial commitment have different properties, such as proof size, prover time, verifier time, post-quantum security, etc. We can build our SNARK by combining the IOP and the polynomial commitment scheme that best suits our needs.

Now that we know what a SNARK is, we will see how we could build both the PLONK and KZG protocols in a distributed manner.

# Preliminaries

Throughout the post we will have a circuit with $N$ gates, $M$ machines computing the proof and each machine will be working on a subcircuit of size $T=\frac{N}{M}$.

We will be using bivariate polynomials to build the constraint system. We will be using one coordinate to represent the gate index and the other to represent the machine index. We will also be using the Lagrange polynomial defined from the $T$-th roots of unity, which we already introduced in the previous blog and has a nice close form.

We will be first solving the case where the computation is done for data-parallel circuits, which means they will be working on separated sub-circuits and the polynomials will be combined into a single bivariate polynomial. This may not sound very useful but if we understand how this works, the general case will be easier to understand. 

# A quick recap of the PLONK protocol

Let's remember the main two checks we had to do in the PLONK protocol:
- Are the gates computed correctly? We will call this the Gate Constraint.
- Are the wires connected correctly? We will call this the Copy Constraint.

The first one was done by checking that the polynomial
$$
g_i(X) := q_{a,i}(X)a_i(X) + q_{b,i}(X)b_i(X) + q_{o,i}(X)o_i(X)+q_{ab,i}(X)a_i(X)b_i(X) + q_{c,i}(X) = 0
$$
for all $X$ in the roots of unity. This was done with a Zero Test. In this post, this will be done the same way, as within each sub-circuit the gates are independent of each other. The main problem will come with the Copy Constraint case.

Last post we used $l, r$ and $o$ as left, right and output gates since this is what the plonk paper uses. In this paper $a, b$ and $o$ are used for the same purposes and this is what we will use in this post.

The Copy Constraint was done by having an extended permutation check on the polynomials $a_i(X)$, $b_i(X)$ and $c_i(X)$, which were the polynomials representing the wires. This was to check whether the connections were correct and whether the outputs of the gates were the input to the other correct gates. If we were to only work on the data-parallel circuits case, then this would be good enough, as the connections would only happen within a single circuit, and therefore $a_i(X)$, $b_i(X)$ and $c_i(X)$ would be a permutation of themselves.

But in the general case, we could have outputs of the circuit from machine $i$ go as inputs to another different machine, and therefore $a_i(X)$, $b_i(X)$ and $c_i(X)$ would not be a permutation of themselves. To solve this general case we will have to recall how the original extended permutation check worked and then see how we can adapt it to the distributed case.

In the permutation check we built the function $z_i(X)$ on $\mathbb{F}$ defined by interpolation:
$$
z_i(w_X^j) := \prod_{k=0}^{j-1}\frac{f_i(w_X^k)}{f_i'(w_X^k)}
$$
where we have that
$$
f_i(X) := (a_i(X)+\beta \sigma_{a,i}(X)+ \gamma)(b_i(X)+\beta \sigma_{b,i}(X)+ \gamma)(o_i(X)+\beta \sigma_{o,i}(X)+ \gamma)\\
f_i'(X) := (a_i(X)+\beta k_aX+ \gamma)(b_i(X)+\beta k_bX+ \gamma)(o_i(X)+\beta k_oX+ \gamma)
$$
And $k_a=1, k_b$ is any quadratic non-residue and $k_o$ is a quadratic non-residue not contained in $k_b\Omega_X$ ($\Omega_X$ is the set of roots of unity).

The constraints we will check to verify correct wire connections are the following:
$$
p_{i,0}(X):= L_o(X)(z_i(X)-1)\\
p_{i,1}(X):= z_i(X)f_i(X) - z_i(w_XX)f_i'(X)
$$
And we will do a zero test in the roots of unity, as we did in the gate constraint case. We could add all 3 constraints into one just by multiplying them by a random factor and doing the Zero Test on all 3 at the same time. Therefore we will just have to compute $h_i(X)$ such that
$$
g_i(X)+\lambda p_{i,0}(X)+\lambda^2 p_{i,1}(X) = V_X(X)h_i(X)
$$
Where $V_X(X) = X^T-1$ and $\lambda$ is the random challenge given by the verifier to ensure they don't cancel each other out.

Why does this work? Is this enough to check wire connections? This is explained in the previous blog post and won't be covered here.

# Constraint System for Data-parallel Circuit

Let's now consider the case that we have $M$ different machines with $T$ gates sub-circuits each, independent from each other. We want to add up the proofs to generate a single proof for the whole circuit.

Let's consider first the Lagrange polynomials on the second variable $Y$, $R_i(Y)$. Then we can define the upper case two variable polynomial for any lower case polynomial on $X$ as
$$
S(Y, X) = \sum_{i=0}^{M-1} R_i(Y)s_i(X)
$$

Each of the machines will have the following set of polynomials:
$$
\{q_{a, i},q_{b, i},q_{o, i},q_{ab, i},q_{c, i},\sigma{a, i},\sigma{b, i}\sigma{o, i},a_i,b_i,o_i,z_i,h_i\}
$$
They are all a result of applying the PLONK protocol on each sub-circuit and all $X$ variable polynomials. For each of them, we can construct the upper case polynomial and we will end up with the following constraint system that should be 0 in all pairs of roots of unity:
$$
G(Y, X):= Q_a(Y, X)A(Y, X) + Q_b(Y, X)B(Y, X) + Q_o(Y, X)O(Y, X)\\ + Q_{ab}(Y, X)AB(Y, X) + Q_c(Y, X)C(Y, X)\\
$$
$$
P_0(Y, X):= L_0(X)(Z(Y, X) - 1)\\
$$
$$
P_1(Y, X):= Z(Y, X) \prod_{S \in A, B, O} (S(Y, X) + \beta \sigma_a(Y, X) + \gamma) - \\ Z(Y, w_XX) \prod_{S \in A, B, O} (S(Y, X) + \beta k_s\sigma_a(Y, X) + \gamma)
$$

If we pay attention we might see that for each $w_Y^i$, $G(w_Y^i, X), P_0(w_Y^i, X), P_1(w_Y^i, X)$ are the constraints for the $i$-th sub-circuit. Therefore it holds that
$$
G(Y, X) + \lambda P_0(Y, X) + \lambda^2 P_1(Y, X) - V_X(X)H_X(Y, X)
$$
is equal to 0 for all $Y \in \Omega_Y$. Therefore we can compute $H_Y(Y, X)$ such that
$$
G(Y, X) + \lambda P_0(Y, X) + \lambda^2 P_1(Y, X) - V_X(X)H_X(Y, X) = V_Y(Y)H_Y(Y, X)
$$
Where $V_Y(Y) = Y^T-1$. This would provide the bivariate polynomial for the Zero Test and would be enough to build the distributed PLONK protocol for the data-parallel case.

What is the problem we are facing in the general case then? The gate constraints are the same since they are independent of each other. The problem is that in the permutation check we verify that $z_i(w_X^{T}):= \prod_{k=0}^{T-1}\frac{f_i(w_X^k)}{f_i'(w_X^k)} = 1$ and this is only true if the permutation is within the same sub-circuit. We will have to add and modify a couple of constraints to solve this problem.

# Constraint System for General Circuit

As we said before, the identity $z_i(w_X^{T}):= \prod_{k=0}^{T-1}\frac{f_i(w_X^k)}{f_i'(w_X^k)} = 1$ doesn't hold in this case, nonetheless, it does hold that
$$
z_i(w_X^{T}):= \prod_{i=0}^{M-1}\prod_{j=0}^{T-1}\frac{f_i(w_X^j)}{f_i'(w_X^j)} = 1
$$
since this would be the same as considering the extended permutation check of the whole circuit.

Even though sending the polynomials $z_i$ to a central node and him computing the proof would work, this would make the algorithm complexity the same as the central node doing all the jobs because of the size of all the polynomials. 

We will then have to slightly modify the $f_i(X)$ and $f_i'(X)$ polynomials to make this work in the following manner:
$$
f_i(X) := (a_i(X)+\beta_Y \sigma_{Y,a,i}(X)+\beta_X \sigma_{X,a,i}(X)+ \gamma)(b_i(X)+\beta_Y \sigma_{Y,b,i}(X)+\beta_X \sigma_{X,b,i}(X)+ \gamma)\\(o_i(X)+\beta_Y \sigma_{Y,o,i}(X)+\beta_X \sigma_{X,o,i}(X)+ \gamma)
$$
$$
f_i'(X) := (a_i(X)+ \beta_Y Y+\beta_X k_aX+ \gamma)(b_i(X)+ \beta_Y Y+\beta_X k_bX+ \gamma)(o_i(X)+ \beta_Y Y+\beta_X k_oX+ \gamma)
$$

Here the permutation polynomial $\sigma_{Y,\cdot, i}$ will represent the machine and $\sigma_{X,\cdot, i}$ will represent the gate in that machine.

Let's now change the $p_{i,1}(X)$ constraint so it holds to
$$
p_{i, 1}(X):= (1-L_{T-1}(X))(z_i(X)f_i(X) - z_i(w_XX)f_i'(X))
$$
which is true since we are multiplying the last term by 0, which was the term that was bringing us problems. 

Now, after constructing $z_i$, each party will send the product of their slices $z_i^*$ to the central node, which will generate a helper polynomial $W(X)$ that will have the running product of all $z_i^*$. That means that $W(w_X^i) = \prod_{j=0}^{i}z_j^* = w_i$. Now we will impose two new constraints which will impose that $w_0 = 1$ and that $w_T = 1$:
$$
p_{i,2}:= w_0-1
$$
$$
p_{i,3}:= L_{N-1}(X)(w_iz_i(X)f_i(X)-w_{(i+1)\%M}f_i'(X))
$$
The first one is clear how it works, the second one we can see that $L_{N-1}(X)$ will only be different than 0 in the case of $X = w^{N-1}$, where we will have
$$
w_{N-1}z_{N-1}f_{N-1}(w^{N-1}) - w_0f_{N-1}'(w^{N-1}) = w_{N-1}z_{N-1}f_{N-1}(w^{N-1}) - f_{N-1}'(w^{N-1}) = 0 
$$
$$
z_{N-1}\frac{f_{N-1}(w^{N-1})}{f_{N-1}'(w^{N-1})} = z_{N}, w_{N-1}z_{N} = w_{N} \implies w_{N} = 1
$$
which is what we want to prove to the verifier.
Therefore, as we did in Plonk, we can batch all the constraints together and apply the Zero Test on them by computing $h_i$
$$
h_i(X) = \frac{g_i(X)+\lambda p_{i,0}(X)+\lambda^2 p_{i,1}(X)+\lambda^4 p_{i,3}(X)}{X^T-1}
$$
And that will give us the upper case polynomial $H_X(Y, X)$
$$
H_X(Y, X) = \sum_{i=0}^{M-1} R_i(Y) h_i(X)Y^i
$$
We can also have the upper case versions of each constraint
$$
P_0(Y, X):= L_0(X)(Z(Y, X) - 1)
$$
$$
P_1(Y, X):= (1-L_{N-1}(X))(Z(Y, X)F(Y, X) - Z(Y, w_XX)F'(Y, X))
$$
$$
P_2(Y):= R_0(Y)(W(Y) - 1)
$$
$$
P_3(Y, X):= L_{N-1}(X)(W(Y)Z(Y, X)F(Y, X) - W(w_YY)F'(Y, X))
$$

We now know that 
$$
G(Y, X) + \lambda P_0(Y, X) + \lambda^2 P_1(Y, X) + \lambda^3 P_2(Y) + \lambda^4P_3(Y, X) - V_X(Y, X)H_X(Y, X)
$$
has to be zero in $\Omega_Y$, and therefore we can do a zero test proving the following equality
$$
G(Y, X) + \lambda P_0(Y, X) + \lambda^2 P_1(Y, X) + \lambda^3 P_2(Y) + \lambda^4P_3(Y, X) = \\ V_X(Y, X)H_X(Y, X) + V_Y(Y)H_Y(Y, X)
$$

That ends up being the general case build for the distributed Plonk IOP. As we mentioned at the beginning, a SNARK is an IOP along with a polynomial commitment. We only have the IOP in a distributed manner, we now need to find a particular polynomial commitment that can work with our distributed IOP. 

We will modify the KZG polynomial commitment scheme to work for our purposes.

# Distributed KZG

As we mentioned in the KZG blog post, the polynomial commitments have 4 main protocols: Setup, Commit, Generate Witness, and Verify. We will be building all of them one by one.

Consider we have $M$ machines $P_0, \cdots, P_{M-1}$ with $P_0$ being the central node. We also have a bivariate polynomial $f(Y, X) = \sum_{i=0}^{M-1}\sum_{j=0}^{T-1}f_{i,j}R_i(Y)L_j(X), with each machine holding $\sum_{j=0}^{T-1}f_{i,j}R_i(Y)$. See that this is the case we face in the distributed Plonk IOP, where each machine holds a slice of the polynomial of this form.

- **Setup$(1^\lambda, M, T)$:** In this protocol, we will receive a security parameter $\lambda$, the number of machines $M$ and the number of gates per machine $T$. With that, we will generate the public parameter with $\alpha_Y$ and $\alpha_X$ being random elements in $\mathbb{F}_p$ that are known to no one.
$$
pp = \left(g, g^{\alpha_X}, g^{\alpha_Y}, U_{j, j}=g^{R_i(\alpha_Y)L_j(\alpha_X)}\right)
$$
- **Commit$(f, pp)$:** Recall that the commitment in the non-distributed KZG is computed by $g^{f(\alpha_Y, \alpha_X)}$. In this case, we will do the same, but in a distributed manner, this involves each machine computing $com_{f_i} = \prod_{j=0}^{T-1}U_{i, j}^{f_{i, j}} = g^{\sum_{j=0}^{T-1}f_{i, j}R_i(\alpha_Y)L_j(\alpha_X)}$ and sends it to $P_0$. Now $P_0$ will have $M$ commitments that will add up to have the full commitment $com_f = \prod_{i=0}^{M-1}com_{f_i} = g^{f(\alpha_Y, \alpha_X)}$.
- **Generate Witness $(f, \beta, \gamma, pp)$:** In the non-distributed 2-variate KZG we would compute the polynomials $q_X, q_Y$ such that $f(Y, X) - f(\beta, \gamma) = (Y-\beta)q_Y(Y, X) + (X - \alpha)q_X(Y, X)$. We will now do the same but in two steps, one in each machine and the other one in the central node. $P_i$ will compute $f_i(\gamma)$ and $q_X^{(i)}(X) = \frac{f_i(X) - f_i(\gamma)}{X-\gamma}$ as well as $\pi_0^{(i)} = g^{R_i(\alpha_Y)q_X^{(i)}(\alpha_X)}$ using the $pp$ and sends $f_i(\gamma)$ and $\pi_0^{(i)}$ to $P_0$. $P_0$ will now compute $\pi_0 = \prod_{i=0}^{M-1} \pi_0^{(i)} = g^{\sum_{i=0}^{M-1}R_i(\alpha_Y)q_X^{(i)}(\alpha_X)}$ and will also compute the polynomial $f(Y, \gamma) = \sum_{i=0}^{M-1} R_i(Y)f_i(\gamma)$. He will finally compute $q_Y(Y) = \frac{f(Y, \gamma) - f(\beta, \gamma)}{Y-\beta}$ and $\pi_1 = g^{q_Y(\alpha_Y)}$ and will send to the verifier $z = f(\beta, \gamma)$ and $\pi = (\pi_0, \pi_1)$.
- **Verify$(com_f, \beta, \gamma, z, \pi_f, pp)$:** The verifier will check if $e(\frac{com_f}{g^z}, g) = e(\pi_0, g^{\alpha_X-\gamma})e(\pi_1, g^{\alpha_Y-\beta})$.

With the verification we are checking the following:
$$
left\_hand\_side: e(\frac{com_f}{g^z}, g) = e(g, g)^{f(\alpha_Y, \alpha_X)-f(\beta, \gamma)}\\
right\_hand\_side: e(\pi_0, g^{\alpha_X-\gamma})e(\pi_1, g^{\alpha_Y-\beta}) = e(g, g)^{(\sum_{i=0}^{M-1}R_i(\alpha_Y)q_X^{(i)}(\alpha_X))(\alpha_X - \gamma)}e(g, g)^{q_Y(\alpha_Y)(\alpha_Y - \beta)}=\\
=e(g, g)^{q_X(\alpha_X)(\alpha_X - \gamma)+q_Y(\alpha_Y)(\alpha_Y - \beta)}
$$

And this equality holds iff
$$
f(\alpha_Y, \alpha_X)-f(\beta, \gamma) = q_X(\alpha_X)(\alpha_X - \gamma)+q_Y(\alpha_Y)(\alpha_Y - \beta)
$$

Which implies WFP that $f(Y, X) - f(\beta, \gamma) = (Y-\beta)q_Y(Y, X) + (X - \alpha)q_X(Y, X)$ and therefore 
$$
z = f(\beta, \gamma)
$$

We finished building the KZG distributed polynomial commitment scheme! I didn't go into much detail since I already have a full blog post about that where I explain everything. Let's now go finish this whole SNARK.

# Putting it all together

Now we have built the distributed IOP from Plonk and the distributed polynomial commitment from KZG. It's time to build the SNARK from those two components.

The protocol in detail can be found in the Pianist paper **Protocol 3**, here I will provide the building blocks we are missing that I haven't yet explained in the IOP nor the polynomial commitment scheme building.

The polynomials that the prover is gonna commit at the beginning of the SNARK protocol are the following:
$$
S_{pp} = \{Q_a(Y, X), Q_b(Y, X), Q_o(Y, X), Q_{ab}(Y, X), Q_c(Y, X), \sigma_{Y, a}(Y, X), \sigma_{Y,b}(Y, X),\\ \sigma_{Y,o}(Y, X), \sigma_{X, a}(Y, X), \sigma_{X,b}(Y, X), \sigma_{X,o}(Y, X)\}
$$
He will also commit to the witness polynomials $A(Y, X), B(Y, X)$ and $O(Y, X)$

Therefore from now on we can consider the verifier has oracle access to those polynomials.

With all those commitments computed using the distributed KZG, the verifier can now provide the challenges $\beta_X$ and $\beta_Y$ and $\gamma$ needed to compute the polynomial $z_i(X)$, which will later be used to compute the polynomial $W(X)$. Using again the distributed KZG we will commit to $W(X)$ and send the commitment to the verifier.

We will now receive another challenge $\lambda$ from the verifier that will be used to batch all the different Zero Tests into one as we explained in the IOP building section. With that, we can compute the commitment to $H_X(Y, X)$, $com_{H_X}$.

Now the verifier will provide us with another challenge $\gamma$ as the $X$ evaluation point for the Zero Test. We will run the first part of the Generate Witness protocol that will provide the proof $\pi_X$ for the first coordinate with all the polynomials in $S_{pp}$ as well as the ones in $S_{wit} = {A(Y, X), B(Y, X), O(Y, X), Z(Y, X)}$.

The prover will also generate the univariate commitment to $H_{Y, \gamma}(Y)$, $com_Y$. 

It's important to point out that with all this information it's still not enough to check the second wire constraint, as it uses $z_i(w_XX)$, and we only have the proof for $z_i(X)$. That is why we will also generate this extra proof $\pi_X$, for now only in the first coordinate.

We then send all the proofs to the verifier along with the commitment to $H_{Y, \gamma}(Y)$.

It may seem weird that we follow this set of interactions in this order, why does the verifier not just send all the challenges at once? This would compromise the validity of the proof since a malicious prover could use this information to generate fake proof of the statement. Now that we know that, let's finish this protocol with the challenge of the $Y$ coordinate.

Finally, the verifier will send the challenge $\beta$ to the prover, which will be used to generate the proof for the $Y$ coordinate. With that, the prover will now generate the proof for the $Y$ coordinate $\pi_Y$ for all the committed polynomials in $S_{pp}\cup S_{wit}$ in point $\beta$, and also for the case $Z(\beta, w_XX), H_X(\beta, \gamma), H_Y(\beta)$ and $W(\beta)$.

With all this information the verifier will now check whether the Zero Test identity holds, as well as the validity of all the proofs.

If everything holds, then the verifier will accept the proof and the protocol will be finished!

# Conclusion

There are many other things worth mentioning, but the blog is already long and hard enough to understand. I will just mention a couple of them.

First of all, this protocol can find out if one of the machines is malicious just by having the central node verify all the proofs each machine provides. 

It is also worth mentioning that the amount of communication between the central node and the machines is $O(1)$ for each machine, which makes it very efficient and removes any problem about network latency or bandwidth occupancy.

If you want to fully understand the protocol I recommend you read the paper, it's very well-written and provides proof for all security properties of the protocol.

After reading the protocol, my first thought was how general this idea could be and if any variation to Plonk, such as HyperPlonk could be decentralized in a similar manner. In the next blog post, I might talk about it if I find some time to think about how could Pianist and Hyperplonk be combined. For now this is enough.

Thanks for reading this post and hope you enjoyed it!

# References

[0] [PLONK original paper](https://eprint.iacr.org/2019/953.pdf)

[1] [KZG original paper](https://cacr.uwaterloo.ca/techreports/2010/cacr2010-10.pdf)

