---
layout: post
title: Magical Algorithms 04 -- The Experts Problem
# subtitle: Excerpt from Soulshaping by Jeff Brown
# cover-img: /assets/img/path.jpg
# thumbnail-img: /assets/img/thumb.png
# share-img: /assets/img/path.jpg
tags: [learning, cs]
author: ten of hearts
mathjax: true
---

Today, I want to introduce a problem full of **uncertainty** and **gaming**: **Online Learning**.

Imagine that you have to decide whether to bring an umbrella every day, or which stock to buy every day. You have $n$ "experts" on hand, and they give you an advice every day. Some experts might be very accurate, some might be guessing blindly, and you don't know which experts are more reliable. We need to find a **strategy** to choose an expert's advice to follow every day, and make our choices as correct as possible.

This is the classic **Experts Problem**. Today we will start from the most naive idea and step by step derive an "optimal strategy" with a clear upper bound on the error rate.

## Problem Description

Let's formalize the problem.

Suppose we have $n$ experts and $T$ days, where $T$ is not necessarily known.
1. On the $t$-th day ($t \in [T]$), each expert $i \in [n]$ gives a prediction.
2. We need to choose to follow the advice of one of the experts, and the expert chosen on the $t$-th day is denoted as $i_{t}$.
3. At the end of each day, based on the result, each expert $i$ incurs a loss $f_i^t \in [0, 1]$.
4. For the expert $i_t$ we chose, our loss for the day is $f_{i_t}^t$.

Our ultimate goal is to **minimize our total loss**:

$$\sum_{t=1}^{T} f_{i_t}^t$$

> For the convenience of discussion and thinking, in this blog we default the loss to be binary: $f_{i_{t}}^{t} \in \left\{ 0, 1 \right\}$

### Evaluation Criterion: Regret

**How do we evaluate whether we did well or not?**

Wanting to guarantee that we choose the expert who performs best **on that day** every day is obviously unrealistic ~~(unless of course you can tell fortunes)~~.

> The expected total loss $\mathcal{F}_{\{\text{total}\}}\le \sum_{t=1}^T \min_{i \in [n]} f_i^t$ is unrealistic.

Therefore, we set a **relative goal**: after $T$ days are over, looking back, if we had stubbornly followed **a single best-performing expert** from the beginning, what would our loss be? The difference between our loss and the loss of this "best expert" is called **Regret**:

$$R = \left( \sum_{t=1}^{T} f_{i_t}^t \right) - \left( \min_{i \in [n]} \sum_{t=1}^{T} f_i^t \right)$$

Our goal is to make $R$ as small as possible. Preferably sublinear, that is, when $T \to \infty$, the average daily regret $\frac{R}{T} \to 0$.

---

## Algorithms
### I: Blind Following Method

The simplest idea: we just fix our eyes on the 1st expert, or arbitrarily designate an expert $u$, and listen to him every day.

$$\text{Algorithm}: i_t = 1, \forall t \in [T]$$

**How about this algorithm?**

Unfortunately, it's very bad. Suppose we face an **adversarial environment**. The adversary only needs to make the expert you choose make a mistake every day ($f_{i_{t}}^t = 1$), while making another expert always correct ($f_{\text{best}}^t = 0$).

> **Adversarial Environment**: Imagine there's an omniscient "adversary" who knows how your algorithm runs, and can **deliberately** set the worst-case loss function $f_i^t$ every day to specifically make your strategy perform the worst. In other words, the adversary is always digging a hole for you to jump in! This is the most malicious assumption, but if our algorithm can perform well even in this situation, it will definitely run very well in the real world (a slightly luckier scenario).

Then:
* Our loss = $T$
* Best expert's loss = $0$
* Regret: $R = T - 0 = T$.

This means we make mistakes every day and never learn anything.

### II: Minority Subordinate to Majority

Since listening to one person doesn't work, let's listen to everyone?
**Strategy**: Tally the predictions of all experts every day, and choose the outcome supported by the **majority** of experts.

**How about this algorithm?** Still very bad.

Proof: The adversary can construct a situation where the "majority" of experts ($1, 2, \dots, n-1$) are wrong every day ($f_{majority}^t = 1$), while there is always a small group of people ($n$) who are right.
The result is still: $f_{our}^t = 1$, while $f_{n}^t = 0$ (there is an expert who is always right).
$\implies R = T$.

> **Conclusion**: In an adversarial environment, no **deterministic** algorithm can achieve sublinear regret. Meaning $R$ will always be proportional to $T$.

### III: Random Random

Since these experts are not necessarily reliable either, I will just pick an expert at random every day and listen to him.

**Strategy**: Uniformly choose one expert randomly from the $n$ experts every day.

Let's look at the expected loss:
$$\mathbb{E}\left[\sum_{t=1}^{T} f_{i_{t}}^{t}\right] = \sum_{t=1}^T \frac{1}{n} \sum_{i=1}^n f_i^t$$

In the worst case, the best expert's loss is 0, while all other experts' losses are 1.
Then the average loss is $\frac{n-1}{n}$.
$$R \le \frac{n-1}{n}T$$

Although randomness is introduced, this regret value is still proportional to $T$, and no real "learning" has taken place.

### IV: Listen to Whoever is Capable

This is a very intuitive strategy: **make use of historical records**! We record the past performance of each expert, and every day choose the expert with the smallest loss **so far**.

**Strategy**: Choose $i_t = \arg\min_i \sum_{\tau=1}^{t-1} f_i^\tau$.

**How about this algorithm?** Actually, it's not very good either.

**Claim**: $R \le \frac{n-1}{n}T$.

**Proof**:
We can construct an adversarial scenario. Suppose there are only 2 experts A and B.
* Day 1: A is wrong, B is right $\to$ We choose B.
* Day 2: B is wrong, A is right $\to$ We choose A.
* Day 3: A is wrong, B is right $\to$ We choose B.
...

This way, whoever we choose gets it wrong ($f_{our}^t = 1$), while the person we didn't choose is always right.

In the end, our loss is $T$, while the best expert's loss is roughly $T/2$. Although it's slightly better than getting everything wrong, Regret is still of the order $O(T)$.

**Can we do better?**

---

### V: Multiplicative Weights Update (MWU)

The core contradiction we want to solve is: we both want to trust the experts who perform well (like Algorithm IV), and not completely rule out other experts (retain randomness like Algorithm III), all while being able to quickly adapt to changes.

The **MWU algorithm** emerges. Its core idea is: assign a weight to each expert; if he makes a mistake, reduce his weight (penalize him), and then randomly choose an expert according to the weight ratio.

#### Algorithm Process

1. **Initialization**: Assign an initial weight $w_i^1 = 1$ to each expert $i$.
2. For each day $t = 1, \dots, T$:
    * **Selection**: Calculate the probability distribution $p^t$ based on the weights, where the probability of choosing expert $i$ is:
        $$p_i^t = \frac{w_i^t}{\sum_{j=1}^n w_j^t}$$
    * **Update**: Observe today's loss vector $f^t$ and update the weight of each expert:
        $$w_i^{t+1} = w_i^t \cdot (1 - \epsilon f_i^t)$$
        Here $\epsilon \in (0, 1)$ is a fixed parameter, similar to a learning rate.

> **Intuitive Understanding**:
>
> This is an "exponential weighting" process. If expert $i$ is terribly wrong ($f_i^t \approx 1$), his weight will be multiplied by $(1-\epsilon)$, decaying rapidly. If he is completely right, the weight remains unchanged.

#### Theoretical Analysis

How strong is this algorithm exactly? We have the following theorem:

**Theorem**: For $\epsilon \in (0, \frac{1}{2})$, the expected regret of the MWU algorithm satisfies:
$$\mathbb{E}[R] \le \epsilon T + \frac{\ln n}{\epsilon}$$

If $T$ is known, we can take the optimal $\epsilon = \sqrt{\frac{\ln n}{T}}$, at this point:
$$\mathbb{E}[R] \le 2\sqrt{T \ln n}$$

This means the average daily regret $\frac{R}{T} \propto \frac{1}{\sqrt{T}}$, when $T \to \infty$, the regret approaches $0$!

##### Proof Process

To prove this theorem, we need to use the **potential function method**. We define the potential function as the sum of all weights:
$$\Phi^t = \sum_{i=1}^n w_i^t$$

**Step 1: Finding an upper bound for $\Phi$**

If a loss occurs on the $t$-th day, the total weight $\Phi$ will decrease.
$$\begin{align*}\Phi^{t+1} &= \sum_{i=1}^n w_i^{t+1} = \sum_{i=1}^n w_i^t(1 - \epsilon f_i^t) \\ &= \sum_{i=1}^n w_i^t - \epsilon \sum_{i=1}^n w_i^t f_i^t\end{align*}$$

Noticing that $p_i^t = \frac{w_i^t}{\Phi^t}$, so $w_i^t = p_i^t \Phi^t$. Substituting into the above equation:
$$\Phi^{t+1} = \Phi^t (1 - \epsilon \sum_{i=1}^n p_i^t f_i^t) = \Phi^t (1 - \epsilon \langle p^t, f^t \rangle)$$

Where $\langle p^t, f^t \rangle$ is exactly our **expected loss** on the $t$-th day:

$$\mathbb{E}\left[f_{i_{t}}^{t}\right] = \sum_{i=1}^{n}p_{i}^{t}f_{i}^{t} = \langle p^t, f^t \rangle$$

Using the common high school inequality $1 - x \le e^{-x}$, we have:
$$\Phi^{t+1} = \Phi^t (1 - \epsilon \langle p^t, f^t \rangle) \le \Phi^t e^{-\epsilon \langle p^t, f^t \rangle}$$

Recursing $T$ times yields the upper bound:
$$\Phi^{T+1} \le \Phi^1 \prod_{t=1}^T e^{-\epsilon \langle p^t, f^t \rangle} = n \cdot e^{-\epsilon \sum_{t=1}^T \langle p^t, f^t \rangle}$$

**Step 2: Finding a lower bound for $\Phi$**

The total weight must be greater than or equal to the weight of any single expert. Suppose the best expert is $k$.
$$\Phi^{T+1} \ge w_k^{T+1} = w_{k}^{1} \cdot \prod_{t=1}^T (1 - \epsilon f_k^t) = \prod_{t=1}^T (1 - \epsilon f_k^t)$$

Using Taylor expansion approximation $\ln(1-x) \ge -x - x^2 \implies 1 - x \geq \exp(-x - x^{2})$ ($x < \frac{1}{2}$), or a stricter inequality, we can deduce:
$$\Phi^{T+1} \ge \prod_{t=1}^T \exp(-\epsilon f_k^t - \epsilon^2 (f_k^t)^2) = \exp(-\epsilon \sum_{t=1}^{T} f_k^t - \epsilon^2 \sum_{t=1}^{T} (f_k^t)^2)$$

**Step 3: Solving jointly**

Combining the results of Step 1 and Step 2:
$$\exp(-\epsilon \sum_{t=1}^{T} f_k^t - \epsilon^2 \sum_{t=1}^{T} (f_k^t)^2) \le \Phi^{T+1} \le n \cdot \exp(-\epsilon \sum_{t=1}^{T} \langle p^t, f^t \rangle)$$

Take the natural logarithm $\ln$ on both sides:
$$-\epsilon \sum_{t=1}^{T} f_k^t - \epsilon^2 \sum_{t=1}^{T} (f_k^t)^2 \le \ln n - \epsilon \sum_{t=1}^{T} \langle p^t, f^t \rangle$$

Rearranging the terms gives:
$$\epsilon \left( \underbrace{\sum_{t=1}^{T} \langle p^t, f^t \rangle - \sum_{t=1}^{T} f_k^t}_{R} \right) \le \ln n + \epsilon^2 \sum_{t=1}^{T} (f_k^t)^2$$

Since $f \in [0,1]$, so $(f_k^t)^2 \le f_k^t \le 1$. Roughly re-scaling $\sum_{t=1}^{T} (f_k^t)^2 \le T$.
Dividing both sides by $\epsilon$:
$$R \le \frac{\ln n}{\epsilon} + \epsilon T$$

Proof completed.

---

## Closing Thoughts

The MWU algorithm is not only used to solve the experts problem, it is a very powerful meta-algorithm.
* **Zero-sum games**: You can use MWU to approximate a Nash equilibrium.
* **Linear programming**: It can be used to quickly find approximate solutions.
* **Adaboost**: The famous ensemble learning algorithm Adaboost is essentially a special form of MWU.

> Furthermore, in modern large models, online learning is also a very important issue. Although there is currently no broadly prevalent algorithm similar to MWU in the field of large model online learning, perhaps we can draw inspiration from MWU and innovate existing online learning or TTS methods.
>
> more importantly, we might be able to draw inspiration from the treasure trove of traditional algorithms. Sometimes brute-force training methods are not the only solution, and traditional algorithms are still very important in the era of deep learning.

I hope this article has broadened your horizons and inspired you. Everyone is welcome to discuss via private message!