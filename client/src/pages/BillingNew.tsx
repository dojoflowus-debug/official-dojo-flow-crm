import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavLayout from '@/components/BottomNavLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, DollarSign, Users, Calendar, Tag, ShoppingBag, Settings } from 'lucide-react';
import { trpc } from '@/lib/trpc';

/**
 * Billing Page - Refactored Structure
 * ====================================
 * Separates billing concerns into distinct sections:
 * A) Programs (membership tracks)
 * B) Membership Plans (pricing tiers)
 * C) Class Entitlements (what classes members can attend)
 * D) One-time Fees (registration, certification, etc.)
 * E) Discounts & Offers (rule-based promotions)
 * F) Add-ons (seminars, tournaments, merchandise)
 */

export default function BillingNew() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('programs');

  // Fetch data for all sections
  const { data: programs } = trpc.billing.getPrograms.useQuery();
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

        {/* Tabs for different sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="programs">
              <Users className="h-4 w-4 mr-2" />
              Programs
            </TabsTrigger>
            <TabsTrigger value="plans">
              <DollarSign className="h-4 w-4 mr-2" />
              Plans
            </TabsTrigger>
            <TabsTrigger value="entitlements">
              <Calendar className="h-4 w-4 mr-2" />
              Entitlements
            </TabsTrigger>
            <TabsTrigger value="fees">
              <DollarSign className="h-4 w-4 mr-2" />
              Fees
            </TabsTrigger>
            <TabsTrigger value="discounts">
              <Tag className="h-4 w-4 mr-2" />
              Discounts
            </TabsTrigger>
            <TabsTrigger value="addons">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Add-ons
            </TabsTrigger>
          </TabsList>

          {/* A) Programs Tab */}
          <TabsContent value="programs" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Programs</CardTitle>
                    <CardDescription>
                      Membership tracks like Free Trial, Black Belt Club, Leadership Team
                    </CardDescription>
                  </div>
                  <Button>
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
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
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
          </TabsContent>

          {/* B) Membership Plans Tab */}
          <TabsContent value="plans" className="space-y-4">
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
                    membershipPlans.map((plan) => (
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
          </TabsContent>

          {/* C) Class Entitlements Tab */}
          <TabsContent value="entitlements" className="space-y-4">
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
          </TabsContent>

          {/* D) One-time Fees Tab */}
          <TabsContent value="fees" className="space-y-4">
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
          </TabsContent>

          {/* E) Discounts Tab */}
          <TabsContent value="discounts" className="space-y-4">
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
          </TabsContent>

          {/* F) Add-ons Tab */}
          <TabsContent value="addons" className="space-y-4">
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
          </TabsContent>
        </Tabs>
      </div>
    </BottomNavLayout>
  );
}
