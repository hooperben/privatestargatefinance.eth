use std::hash::poseidon2;

fn calculate_leaf(asset_id: Field, asset_amount: Field, owner: Field, secret: Field) -> Field {
    let leaf_hash = poseidon2::Poseidon2::hash([asset_id, asset_amount, owner, secret], 4);

    leaf_hash
}

fn main(
    hash: pub Field,
    asset_id: pub Field,
    asset_amount: pub Field,
    owner: Field,
    secret: Field,
) {
    let reconstructed_leaf = calculate_leaf(asset_id, asset_amount, owner, secret);

    assert(reconstructed_leaf == hash);
}

#[test]
fn test_main() {
    let hash = 10910144734164300572556906959851189945387330502503241183170231141863664833516;
    let asset_id = 1318135792822270024232500151108749119773765723518;
    let amount = 10000000;
    let owner = 10812186542955647827474372651967207045861174805371180171801345448553285386806;
    let secret = 2389312107716289199307843900794656424062350252250388738019021107824217896920;

    main(hash, asset_id, amount, owner, secret);
}
