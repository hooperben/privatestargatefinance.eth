# privatestargatefinance.eth

a UI and account model for interacting with the Private Stargate Finance protocol

#### private-stargate-finance (fork base)

the `circuits` and `contracts` were taken from the head of [this repo](https://github.com/hooperben/private-stargate-finance). At the time of forking, I'm pretty confident the core protocol of Private Stargate finance is done, with the note(haha)able exception of:

- actual mainnet tx(s) with stargate assets
- recursive merkle tree data structure implementation

### Repository Structure

### `client/`

`client/` contains the react app built and deployed to [privatestargatefinance.eth.limo](https://privatestargatefinance.eth.limo)

#### `contracts/`

`contracts/` contains the hardhat project that handles all of the smart contracts for private stargate finance

#### `circuits/`

`circuits/` contains the noir circuits that power all of the privacy enchancing features of this protocol

### Recommended Readings

have a look at this excalidraw for a more indepth, slightly rambling explanation of how this all works:

[https://link.excalidraw.com/l/5BJ6ZosQeYI/8CgytajWHYz
](https://link.excalidraw.com/l/5BJ6ZosQeYI/8CgytajWHYz)

### Versions

versions used of noir and bb:

```bash
% nargo --version
nargo version = 1.0.0-beta.6
noirc version = 1.0.0-beta.6+e796dfd67726cbc28eb9991782533b211025928d
(git version hash: e796dfd67726cbc28eb9991782533b211025928d, is dirty: false)
% bb --version
v0.84.0
```
