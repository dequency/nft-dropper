from pyteal import *


drop_selector = MethodSignature("drop(asset)void")


@Subroutine(TealType.uint64)
def drop_asset():
    asset_id = Txn.assets[Btoi(Txn.application_args[1])]
    return Seq(
        bal := AssetHolding.balance(Txn.sender(), asset_id),
        # Make sure they dont have any of this asset yet
        Assert(And(bal.hasValue(), bal.value() == Int(0))),
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields(
            {
                TxnField.type_enum: TxnType.AssetTransfer,
                TxnField.xfer_asset: asset_id,
                TxnField.asset_amount: Int(1),
                TxnField.asset_receiver: Txn.sender(),
            }
        ),
        InnerTxnBuilder.Submit(),
        Int(1),
    )


opt_in_selector = MethodSignature("optin(asset)void")


def opt_into_asset():
    asset_id = Txn.assets[Btoi(Txn.application_args[1])]
    return Seq(
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields(
            {
                TxnField.type_enum: TxnType.AssetTransfer,
                TxnField.xfer_asset: asset_id,
                TxnField.asset_amount: Int(0),
                TxnField.asset_receiver: Global.current_application_address(),
            }
        ),
        InnerTxnBuilder.Submit(),
        Int(1),
    )


def approval():

    router = Cond(
        [
            And(
                Txn.application_args[0] == opt_in_selector,
                Txn.sender() == Global.creator_address(),
            ),
            opt_into_asset(),
        ],
        [Txn.application_args[0] == drop_selector, drop_asset()],
    )

    return Cond(
        [Txn.application_id() == Int(0), Approve()],
        [Txn.on_completion() == OnComplete.UpdateApplication, Reject()],
        [Txn.on_completion() == OnComplete.ClearState, Reject()],
        [Txn.on_completion() == OnComplete.CloseOut, Reject()],
        [Txn.on_completion() == OnComplete.DeleteApplication, Reject()],
        [Txn.on_completion() == OnComplete.OptIn, Reject()],
        [Txn.on_completion() == OnComplete.NoOp, Return(router)],
    )


def get_approval_src():
    return compileTeal(approval(), mode=Mode.Application, version=6)


def get_clear_src():
    return compileTeal(Approve(), mode=Mode.Application, version=6)


if __name__ == "__main__":
    print(get_approval_src())
