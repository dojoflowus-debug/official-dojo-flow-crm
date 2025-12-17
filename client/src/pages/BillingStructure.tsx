import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavLayout from '@/components/BottomNavLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, DollarSign, Users, Calendar, Tag, ShoppingBag, Settings, Pencil, Trash2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { ProgramModal } from '@/components/ProgramModal';
import { toast } from 'sonner';

/**
 * Billing Structure Page
 * Separates billing into: Programs, Plans, Entitlements, Fees, Discounts, Add-ons
 */

type TabValue = 'programs' | 'plans' | 'entitlements' | 'fees' | 'discounts' | 'addons';

export default function BillingStructure() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabValue>('programs');
  const [programModalOpen, setProgramModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);

  // Fetch data for all sections
  const { data: programs } = trpc.billing.getPrograms.useQuery();
  const utils = trpc.useUtils();
  
  const deleteProgramMutation = trpc.billing.deleteProgram.useMutation({
    onSuccess: () => {
      toast.success('Program deleted successfully');
      utils.billing.getPrograms.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to delete program: ${error.message}`);
    },
  });

  const handleDeleteProgram = (id: number) => {
    if (window.confirm('Are you sure you want to delete this program?')) {
      deleteProgramMutation.mutate({ id });
    }
  };
  const { data: membershipPlans } = trpc.membershipPlans.getAll.useQuery();
  const { data: classEntitlements } = trpc.classEntitlements.getAll.useQuery();
  const { data: oneTimeFees } = trpc.oneTimeFees.getAll.useQuery();
  const { data: discounts } = trpc.discounts.getAll.useQuery();
  const { data: addOns } = trpc.addOns.getAll.useQuery();

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const tabs = [
    { value: 'programs', label: 'Programs', icon: Users },
    { value: 'plans', label: 'Plans', icon: DollarSign },
    { value: 'entitlements', label: 'Entitlements', icon: Calendar },
    { value: 'fees', label: 'Fees', icon: DollarSign },
    { value: 'discounts', label: 'Discounts', icon: Tag },
    { value: 'addons', label: 'Add-ons', icon: ShoppingBag },
  ] as const;

  return (
    <BottomNavLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Billing Structure</h1>
            <p className="text-muted-foreground">
              Configure programs, pricing, entitlements, fees, and discounts
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/billing')}>
            <Settings className="h-4 w-4 mr-2" />
            Payment Settings
          </Button>
        </div>

        {/* Custom Tab Navigation */}
        <div className="border-b border-border">
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value as TabValue)}
                  className={`
                    flex items-center px-4 py-2 text-sm font-medium transition-colors
                    border-b-2 -mb-px
                    ${
                      activeTab === tab.value
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                    }
                  `}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {/* Programs Tab */}
          {activeTab === 'programs' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Programs</CardTitle>
                    <CardDescription>
                      Membership tracks like Free Trial, Black Belt Club, Leadership Team
                    </CardDescription>
                  </div>
                  <Button onClick={() => { setSelectedProgram(null); setProgramModalOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Program
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {programs && programs.length > 0 ? (
                    programs.map((program) => (
                      <div
                        key={program.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{program.name}</h3>
                            {program.eligibility === 'invitation_only' && (
                              <Badge variant="secondary">Invitation Only</Badge>
                            )}
                            {program.showOnKiosk === 1 && (
                              <Badge variant="outline">Kiosk</Badge>
                            )}
                          </div>
                          {program.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {program.description}
                            </p>
                          )}
                          <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                            {program.termLength && (
                              <span>{program.termLength} months</span>
                            )}
                            {program.ageRange && (
                              <span>Ages: {program.ageRange}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => { setSelectedProgram(program); setProgramModalOpen(true); }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteProgram(program.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No programs configured yet</p>
                      <p className="text-sm mt-1">Create your first membership program</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Plans Tab */}
          {activeTab === 'plans' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Membership Plans</CardTitle>
                    <CardDescription>
                      Pricing tiers: $149/mo, $199/mo, $249/mo with different terms
                    </CardDescription>
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Plan
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {membershipPlans && membershipPlans.length > 0 ? (
                    membershipPlans.slice(0, 6).map((plan) => (
                      <Card key={plan.id} className="relative">
                        {plan.isPopular === 1 && (
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-primary">Popular</Badge>
                          </div>
                        )}
                        <CardHeader>
                          <CardTitle className="text-lg">{plan.name}</CardTitle>
                          <div className="text-3xl font-bold text-primary">
                            {formatCurrency(plan.monthlyAmount)}
                            <span className="text-sm font-normal text-muted-foreground">
                              /{plan.billingCycle}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {plan.description && (
                            <p className="text-sm text-muted-foreground mb-4">
                              {plan.description}
                            </p>
                          )}
                          <div className="space-y-2 text-sm">
                            {plan.termLength && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Term:</span>
                                <span className="font-medium">{plan.termLength} months</span>
                              </div>
                            )}
                            {plan.registrationFee > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Registration:</span>
                                <span className="font-medium">
                                  {formatCurrency(plan.registrationFee)}
                                </span>
                              </div>
                            )}
                            {plan.downPayment > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Down Payment:</span>
                                <span className="font-medium">
                                  {formatCurrency(plan.downPayment)}
                                </span>
                              </div>
                            )}
                          </div>
                          <Button variant="outline" size="sm" className="w-full mt-4">
                            Edit Plan
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No membership plans configured yet</p>
                      <p className="text-sm mt-1">Create your first pricing tier</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Entitlements Tab */}
          {activeTab === 'entitlements' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Class Entitlements</CardTitle>
                    <CardDescription>
                      Define what classes members can attend (unlimited, 2x/week, 3x/week, etc.)
                    </CardDescription>
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Entitlement
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {classEntitlements && classEntitlements.length > 0 ? (
                    classEntitlements.map((entitlement) => (
                      <div
                        key={entitlement.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{entitlement.name}</h3>
                            {entitlement.isUnlimited === 1 && (
                              <Badge variant="default">Unlimited</Badge>
                            )}
                          </div>
                          {entitlement.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {entitlement.description}
                            </p>
                          )}
                          <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                            {entitlement.classesPerWeek && (
                              <span>{entitlement.classesPerWeek}x per week</span>
                            )}
                            {entitlement.classesPerMonth && (
                              <span>{entitlement.classesPerMonth}x per month</span>
                            )}
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No class entitlements configured yet</p>
                      <p className="text-sm mt-1">Define class access rules</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fees Tab */}
          {activeTab === 'fees' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>One-time Fees</CardTitle>
                    <CardDescription>
                      Registration, down payment, certification, testing, equipment fees
                    </CardDescription>
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Fee
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {oneTimeFees && oneTimeFees.length > 0 ? (
                    oneTimeFees.map((fee) => (
                      <div
                        key={fee.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{fee.name}</h3>
                            <Badge variant="outline">{fee.feeType}</Badge>
                            {fee.isRequired === 1 && (
                              <Badge variant="destructive">Required</Badge>
                            )}
                          </div>
                          {fee.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {fee.description}
                            </p>
                          )}
                          <div className="flex gap-4 mt-2 text-sm">
                            <span className="font-semibold text-primary">
                              {formatCurrency(fee.amount)}
                            </span>
                            <span className="text-muted-foreground">
                              Charged: {fee.chargeWhen.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No one-time fees configured yet</p>
                      <p className="text-sm mt-1">Add registration or equipment fees</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Discounts Tab */}
          {activeTab === 'discounts' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Discounts & Offers</CardTitle>
                    <CardDescription>
                      Rule-based promotions: competitor match, family discount, paid-in-full waiver
                    </CardDescription>
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Discount
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {discounts && discounts.length > 0 ? (
                    discounts.map((discount) => (
                      <div
                        key={discount.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{discount.name}</h3>
                            <Badge variant="secondary">
                              {discount.discountType === 'percentage'
                                ? `${discount.discountValue}% off`
                                : discount.discountType === 'fixed_amount'
                                ? formatCurrency(discount.discountValue)
                                : discount.discountType}
                            </Badge>
                            {discount.requiresApproval === 1 && (
                              <Badge variant="outline">Requires Approval</Badge>
                            )}
                          </div>
                          {discount.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {discount.description}
                            </p>
                          )}
                          <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                            <span>Applies to: {discount.appliesTo.replace('_', ' ')}</span>
                            {discount.maxUses && (
                              <span>
                                Uses: {discount.currentUses}/{discount.maxUses}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Tag className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No discounts configured yet</p>
                      <p className="text-sm mt-1">Create promotional offers</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add-ons Tab */}
          {activeTab === 'addons' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Add-ons</CardTitle>
                    <CardDescription>
                      Optional purchases: seminars, tournaments, merchandise, camps
                    </CardDescription>
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {addOns && addOns.length > 0 ? (
                    addOns.map((addOn) => (
                      <Card key={addOn.id}>
                        {addOn.imageUrl && (
                          <div className="h-32 bg-muted overflow-hidden">
                            <img
                              src={addOn.imageUrl}
                              alt={addOn.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{addOn.name}</CardTitle>
                            <Badge variant="outline">{addOn.addOnType}</Badge>
                          </div>
                          <div className="text-2xl font-bold text-primary">
                            {formatCurrency(addOn.price)}
                            {addOn.pricingType !== 'one_time' && (
                              <span className="text-sm font-normal text-muted-foreground">
                                /{addOn.pricingType.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          {addOn.description && (
                            <p className="text-sm text-muted-foreground mb-4">
                              {addOn.description}
                            </p>
                          )}
                          {addOn.maxCapacity && (
                            <div className="text-sm text-muted-foreground mb-4">
                              Capacity: {addOn.currentEnrollment}/{addOn.maxCapacity}
                            </div>
                          )}
                          <Button variant="outline" size="sm" className="w-full">
                            Edit
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No add-ons configured yet</p>
                      <p className="text-sm mt-1">Add seminars, tournaments, or merchandise</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Modals */}
      <ProgramModal 
        open={programModalOpen} 
        onOpenChange={setProgramModalOpen}
        program={selectedProgram}
        onSuccess={() => {
          setProgramModalOpen(false);
          setSelectedProgram(null);
        }}
      />
    </BottomNavLayout>
  );
}
