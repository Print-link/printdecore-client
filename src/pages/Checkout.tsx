import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { SpinnerGap, CheckCircle, WarningCircle, ArrowLeft, Tag, X } from "@phosphor-icons/react";
import { toast } from "react-toastify";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../contexts/CartContext";
import {
  createOrder,
  createOrderItem,
  uploadMultipleFiles,
  validateDiscountCode,
  getActiveBranchDiscounts,
  type DiscountValidationResult,
  type ActiveBranchDiscount,
} from "../services/orderApi";
import type { FileInfo } from "../services/orderApi";
import { getBranchById } from "../services/branches.service";
import { PaymentModal } from "../components/PaymentModal";
import {
  clearPendingPayment,
  type StagedFileInfo,
} from "../services/paystackService";

export const Checkout = () => {
  const { branchId } = useParams<{ branchId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, clearCart, getCartTotal, comment } = useCart();
  const queryClient = useQueryClient();

  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [branch, setBranch] = useState<{
    payStackSubAccountId?: string;
  } | null>(null);
  const [loadingBranch, setLoadingBranch] = useState(false);
  const [isStagingFiles, setIsStagingFiles] = useState(false);
  // Staged file URLs per cart item index — uploaded before payment
  const [stagedFilesMap, setStagedFilesMap] = useState<
    Map<number, StagedFileInfo[]>
  >(new Map());

  // Discount / promo code state
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountValidationResult | null>(null);
  const [branchDiscounts, setBranchDiscounts] = useState<ActiveBranchDiscount[]>([]);

  useEffect(() => {
    const fetchBranch = async () => {
      if (!branchId) return;
      setLoadingBranch(true);
      try {
        const response = await getBranchById(branchId);
        if (response.success && response.data) {
          setBranch(response.data);
        }
      } catch (error) {
        console.error("Error fetching branch:", error);
        toast.error("Failed to load branch information");
      } finally {
        setLoadingBranch(false);
      }
    };
    fetchBranch();
  }, [branchId]);

  // Fetch active discounts for this branch and auto-apply the best one
  useEffect(() => {
    if (!branchId) return;
    getActiveBranchDiscounts(branchId)
      .then((discounts) => {
        setBranchDiscounts(discounts);
        // Auto-apply the first (best) discount
        if (discounts.length > 0 && !appliedDiscount) {
          const best = discounts[0];
          setPromoCode(best.code);
          validateDiscountCode(best.code, getCartTotal(), branchId)
            .then((result) => {
              if (result.success && result.data) {
                setAppliedDiscount(result.data);
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoError("");
    setIsValidatingPromo(true);
    try {
      const result = await validateDiscountCode(promoCode.trim(), getCartTotal(), branchId);
      if (result.success && result.data) {
        setAppliedDiscount(result.data);
        toast.success(`Discount applied: ${result.data.discountType === 'percentage' ? `${result.data.discountValue}%` : `GHS ${result.data.discountAmount}`} off`);
      } else {
        setPromoError(result.message || "Invalid promo code");
        setAppliedDiscount(null);
      }
    } catch {
      setPromoError("Failed to validate promo code");
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedDiscount(null);
    setPromoCode("");
    setPromoError("");
  };

  const getSubtotal = () => {
    return getCartTotal();
  };

  const getDiscountAmount = () => {
    return appliedDiscount?.discountAmount || 0;
  };

  const getDiscountedSubtotal = () => {
    return Math.max(0, getSubtotal() - getDiscountAmount());
  };

  const getTransactionFee = () => {
    return Math.round(getDiscountedSubtotal() * 0.0195 * 100) / 100;
  };

  const getTotalWithFee = () => {
    const discounted = getDiscountedSubtotal();
    const fee = Math.round(discounted * 0.0195 * 100) / 100;
    return Math.round((discounted + fee) * 100) / 100;
  };

  const handlePlaceOrder = async () => {
    if (!user?._id || !branchId) {
      toast.error("User authentication or branch information is missing");
      return;
    }

    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    if (!branch?.payStackSubAccountId) {
      toast.error("Branch payment information is not configured");
      return;
    }

    // Stage files to Cloudinary BEFORE opening payment.
    // This ensures files are recoverable if the app dies after payment.
    const hasFiles = cart.some((item) => item.files.length > 0);
    if (hasFiles) {
      setIsStagingFiles(true);
      setCurrentStep("Preparing your files...");
      try {
        const newMap = new Map<number, StagedFileInfo[]>();
        for (let i = 0; i < cart.length; i++) {
          const item = cart[i];
          if (item.files.length > 0) {
            setCurrentStep(
              `Uploading files for item ${i + 1} of ${cart.length}...`,
            );
            const uploadResponse = await uploadMultipleFiles(
              item.files,
              `orders/staging/${Date.now()}`,
            );
            if (uploadResponse.success && uploadResponse.data) {
              newMap.set(
                i,
                uploadResponse.data.map((file) => ({
                  url: file.url,
                  publicId: file.publicId,
                  name: file.name,
                  size: file.size,
                  type: file.type,
                  width: file.width,
                  height: file.height,
                  format: file.format,
                  bytes: file.bytes,
                })),
              );
            }
          }
        }
        setStagedFilesMap(newMap);
      } catch (error) {
        console.error("File staging failed:", error);
        toast.error("Failed to upload files. Please try again.");
        setIsStagingFiles(false);
        setCurrentStep("");
        return;
      }
      setIsStagingFiles(false);
      setCurrentStep("");
    }

    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async (paymentData: {
    reference: string;
    amount: number;
  }) => {
    if (!user?._id || !branchId || !paymentData.reference) {
      toast.error("Payment verification failed");
      return;
    }

    setShowPaymentModal(false);
    setIsProcessing(true);

    try {
      setCurrentStep("Creating order with verified payment...");
      // Send the original cart subtotal (before discount) — the backend
      // re-validates the discount server-side and computes the final total itself.
      const orderResponse = await createOrder(
        user._id,
        branchId,
        paymentData.reference,
        getSubtotal(),
        comment || undefined,
        appliedDiscount?.code,
      );

      if (!orderResponse.success || !orderResponse.data) {
        throw new Error(orderResponse.message || "Failed to create order");
      }

      const order = orderResponse.data;
      setOrderId(order.id);

      for (let i = 0; i < cart.length; i++) {
        const item = cart[i];
        setCurrentStep(`Creating order item ${i + 1} of ${cart.length}...`);

        // Use pre-staged files (uploaded before payment started)
        const stagedFiles: FileInfo[] = (stagedFilesMap.get(i) || []).map(
          (f) => ({
            url: f.url,
            publicId: f.publicId,
            name: f.name,
            size: f.size,
            type: f.type,
            width: f.width,
            height: f.height,
            format: f.format,
            bytes: f.bytes,
          }),
        );

        const orderItemResponse = await createOrderItem({
          orderId: order.id,
          agentServiceId: item.agentServiceId,
          // New flexible pricing fields
          selectedBaseConfigId: item.selectedBaseConfigId,
          selectedOptions: item.selectedOptions,
          selectedCustomSpecs: item.selectedCustomSpecs,
          // Legacy fields
          width: item.width,
          height: item.height,
          measurementUnit: item.measurementUnit,
          formulaType: item.formulaType,
          quantity: item.quantity,
          options: {
            // Include new flexible config in options for reference
            selectedBaseConfigId: item.selectedBaseConfigId,
            selectedOptions: item.selectedOptions,
            selectedCustomSpecs: item.selectedCustomSpecs,
            // Legacy options
            ...item.options,
            // Pre-staged file URLs
            files: stagedFiles,
          },
          calculatedPrice: item.calculatedPrice,
        });

        if (!orderItemResponse.success) {
          console.warn(`Failed to create order item ${i + 1}, continuing...`);
        }
      }

      clearCart();
      toast.success("Cart cleared successfully");

      // Clear pending payment from Redis — order was created successfully
      clearPendingPayment(paymentData.reference).catch(() => {});

      if (user?._id) {
        queryClient.invalidateQueries({ queryKey: ["orders", user._id] });
        queryClient.invalidateQueries({ queryKey: ["order", order.id] });
      }

      setCurrentStep("Order placed successfully!");
      toast.success("Order placed successfully!");

      setTimeout(() => {
        navigate(`/home/order/${order.id}`);
      }, 1500);
    } catch (error) {
      console.error("Error placing order:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to place order. Please try again.";
      toast.error(errorMessage);

      if (orderId) {
        toast.info(
          "Order was created but some items failed. You can retry or cancel the order.",
        );
      }
    } finally {
      setIsProcessing(false);
      setCurrentStep("");
    }
  };

  const handlePaymentError = (error: string) => {
    toast.error(error);
    setShowPaymentModal(false);
  };

  if (cart.length === 0) {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={16} weight="bold" className="mr-2" />
          Back
        </button>
        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl p-8 text-center border border-gray-300 dark:border-gray-600">
          <WarningCircle size={48} weight="duotone" className="text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Cart is Empty
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Add items to your cart before checkout
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-[#fbbf24] text-white rounded-lg hover:bg-[#fbbf24]"
          >
            Go to Cart
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-4">
        <button
          onClick={() => navigate(-1)}
          className="mb-3 inline-flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={16} weight="bold" className="mr-2" />
          Back
        </button>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1">
          Checkout
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Review your order and place it</p>
      </div>

      <div className="bg-white dark:bg-[#1e1e1e] rounded-lg border-2 border-gray-200 dark:border-gray-700 p-4 mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Order Summary
        </h2>
        <div className="space-y-2 mb-3">
          {cart.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {item.quantity}x Service Item
                {item.files.length > 0 &&
                  ` (${item.files.length} file${
                    item.files.length > 1 ? "s" : ""
                  })`}
              </span>
              <span className="font-medium">
                GHS {item.calculatedPrice.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        {/* Promo Code Section */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          {appliedDiscount ? (
            <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <Tag size={16} weight="fill" className="text-green-600" />
                <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                  {appliedDiscount.code}
                </span>
                <span className="text-xs text-green-600 dark:text-green-500">
                  {appliedDiscount.discountType === 'percentage'
                    ? `${appliedDiscount.discountValue}% off`
                    : `GHS ${appliedDiscount.discountAmount.toFixed(2)} off`}
                </span>
              </div>
              <button onClick={handleRemovePromo} className="p-1 hover:bg-green-100 dark:hover:bg-green-800 rounded transition-colors">
                <X size={14} weight="bold" className="text-green-600" />
              </button>
            </div>
          ) : (
            <div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(""); }}
                  placeholder="Enter promo code"
                  className="flex-1 px-3 py-2 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#fbbf24] focus:outline-none"
                />
                <button
                  onClick={handleApplyPromo}
                  disabled={!promoCode.trim() || isValidatingPromo}
                  className="px-4 py-2 text-sm font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors"
                >
                  {isValidatingPromo ? <SpinnerGap size={14} className="animate-spin" /> : "Apply"}
                </button>
              </div>
              {promoError && <p className="text-xs text-red-500 mt-1">{promoError}</p>}
              {branchDiscounts.length > 0 && !promoCode && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {branchDiscounts.slice(0, 3).map((d) => (
                    <button
                      key={d.id}
                      onClick={() => { setPromoCode(d.code); }}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                    >
                      <Tag size={10} weight="fill" />
                      {d.code}: {d.discountType === 'percentage' ? `${d.discountValue}% off` : `${d.currency} ${d.discountValue} off`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Subtotal</span>
            <span className="text-base font-semibold text-gray-900 dark:text-white">
              GHS {getSubtotal().toFixed(2)}
            </span>
          </div>
          {appliedDiscount && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                Discount ({appliedDiscount.code})
              </span>
              <span className="text-base font-semibold text-green-600 dark:text-green-400">
                - GHS {getDiscountAmount().toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Transaction Fee (1.95%)
            </span>
            <span className="text-base font-semibold text-gray-900 dark:text-white">
              GHS {getTransactionFee().toFixed(2)}
            </span>
          </div>
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">Total</span>
            <span className="text-2xl font-bold text-[#fbbf24]">
              GHS {getTotalWithFee().toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {(isProcessing || isStagingFiles) && (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <SpinnerGap size={20} weight="bold" className="text-blue-600 animate-spin" />
            <span className="text-sm text-blue-900">{currentStep}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4">
        <button
          onClick={() => navigate(-1)}
          disabled={isProcessing || showPaymentModal}
          className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 disabled:opacity-50 transition-all"
        >
          Cancel
        </button>
        <button
          onClick={handlePlaceOrder}
          disabled={
            isProcessing ||
            isStagingFiles ||
            !user ||
            loadingBranch ||
            !branch?.payStackSubAccountId
          }
          className="flex-1 px-4 py-3 bg-[#fbbf24] text-white rounded-lg font-semibold hover:bg-[#d97706] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
        >
          {isProcessing || isStagingFiles ? (
            <>
              <SpinnerGap size={16} weight="bold" className="animate-spin" />
              {isStagingFiles ? "Preparing files..." : "Processing..."}
            </>
          ) : (
            <>
              <CheckCircle size={16} weight="bold" />
              Place Order
            </>
          )}
        </button>
      </div>

      {showPaymentModal && branch?.payStackSubAccountId && user?.email && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          amount={getTotalWithFee()}
          email={user.email}
          subaccount={branch.payStackSubAccountId}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
          clientId={user._id}
          branchId={branchId}
          totalPrice={getSubtotal()}
          comment={comment || undefined}
          cartItems={cart.map((item, idx) => ({
            agentServiceId: item.agentServiceId,
            selectedBaseConfigId: item.selectedBaseConfigId,
            selectedOptions: item.selectedOptions,
            selectedCustomSpecs: item.selectedCustomSpecs,
            width: item.width,
            height: item.height,
            measurementUnit: item.measurementUnit,
            formulaType: item.formulaType,
            quantity: item.quantity,
            options: {
              frontBack: item.options.frontBack,
              color: item.options.color,
              printCut: item.options.printCut,
              frontOnly: item.options.frontOnly,
              filePages: item.options.filePages,
              numberOfPages: item.options.numberOfPages,
            },
            calculatedPrice: item.calculatedPrice,
            fileCount: item.files.length,
            stagedFiles: stagedFilesMap.get(idx),
          }))}
        />
      )}
    </div>
  );
};
